import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { getPaymentProvider } from "./provider";
import type { BillingAddress, PaymentMethod, PaymentOutcome } from "./types";

// Serviço de pagamento (spec §6.2). Liga a porta do provedor ao banco:
// cria a intent, registra a tentativa em `payments`, aplica o desfecho ao pedido
// (awaiting_payment → paid) e grava o evento na linha do tempo. Tudo idempotente.

export type PayResult =
  | {
      orderId: string;
      status: string;
      paymentStatus: string;
      providerRef: string;
      /** PIX: copia-e-cola p/ o cliente concluir. Vazio no cartão (já resolvido). */
      clientToken?: string;
    }
  | { error: string; detail?: string };

/** Dados que só o cliente tem na hora de pagar — não persistidos no pedido. */
export interface PayOptions {
  /** Token do cartão gerado no navegador (o PAN nunca chega aqui). */
  paymentToken?: string;
  installments?: number;
  /** CPF do pagador — exigido pelo PIX do Pagar.me. */
  document?: string;
  /** Telefone informado no checkout — só usado se o paciente não tiver um no cadastro. */
  phone?: string;
  /** Endereço de cobrança (vem do bloco Entrega). Obrigatório no cartão. */
  billingAddress?: BillingAddress;
}

/**
 * Inicia (e, no stub síncrono, confirma na hora) o pagamento de um pedido
 * `awaiting_payment`. Escopo por paciente no servidor (nunca por parâmetro).
 * Idempotente: pedido já pago devolve o estado atual sem cobrar de novo.
 */
export async function payOrder(
  patientId: string,
  orderId: string,
  method: PaymentMethod = "pix",
  opts: PayOptions = {},
): Promise<PayResult> {
  const sb: any = createAdminClient();

  const { data: order } = await sb
    .from("orders")
    .select("id, patient_id, total, status, payment_status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "order_not_found" };
  if (order.patient_id !== patientId) return { error: "forbidden" };
  if (order.status === "paid" || order.payment_status === "paid") {
    return { orderId, status: order.status, paymentStatus: order.payment_status, providerRef: "" };
  }
  if (order.status !== "awaiting_payment") {
    return { error: "order_not_payable", detail: order.status };
  }

  const { data: patient } = await sb
    .from("patients")
    .select("name, email, phone")
    .eq("id", patientId)
    .single();

  const provider = getPaymentProvider();

  // 1) abre a cobrança no provedor e registra a tentativa. Uma falha aqui é do
  //    provedor (chave inválida, cartão recusado na autorização, rede) — devolve
  //    erro sem sujar o pedido, que segue `awaiting_payment` e pode ser retentado.
  let intent;
  try {
    intent = await provider.createIntent({
      orderId,
      amount: Number(order.total),
      currency: "BRL",
      method,
      customer: {
        patientId,
        name: patient?.name ?? "",
        email: patient?.email ?? "",
        document: opts.document,
        // O cadastro manda; o checkout serve de rede se o paciente não tiver telefone.
        phone: patient?.phone ?? opts.phone,
      },
      paymentToken: opts.paymentToken,
      installments: opts.installments,
      billingAddress: opts.billingAddress,
    });
  } catch (e) {
    return { error: "payment_provider_error", detail: (e as Error).message };
  }
  // A linha nasce em `created` mesmo que o provedor já tenha aprovado na abertura
  // (o Pagar.me, com captura direta, devolve a cobrança paga de imediato). Quem
  // aplica o desfecho é sempre o applyOutcome — e ele sai cedo se a linha já
  // estiver num estado terminal. Gravar `paid` aqui faria o guarda de idempotência
  // engolir a própria confirmação e o pedido nunca sairia de awaiting_payment.
  const { error: payErr } = await sb.from("payments").insert({
    order_id: orderId,
    provider: provider.id,
    provider_ref: intent.providerRef,
    amount: order.total,
    status: "created",
    raw: {},
  });
  if (payErr && !/duplicate key/i.test(payErr.message)) {
    return { error: "payment_create_failed", detail: payErr.message };
  }

  // 2) confirma. No stub o desfecho é síncrono; no Pagar.me isso relê a cobrança
  //    (o desfecho real do PIX chega por webhook — aplicar nos dois é seguro,
  //    applyOutcome é idempotente).
  const outcome = await provider.confirm({ providerRef: intent.providerRef });
  await applyOutcome(sb, outcome);

  const { data: fresh } = await sb
    .from("orders")
    .select("status, payment_status")
    .eq("id", orderId)
    .single();
  return {
    orderId,
    status: fresh?.status ?? order.status,
    paymentStatus: fresh?.payment_status ?? order.payment_status,
    providerRef: intent.providerRef,
    clientToken: intent.clientToken || undefined,
  };
}

/**
 * Aplica o desfecho de uma cobrança ao pedido. Reentrante e idempotente — a mesma
 * função serve ao confirm síncrono e ao webhook assíncrono. A transição do pedido
 * é guardada por `.eq("status","awaiting_payment")` para nunca reverter estado.
 */
export async function applyOutcome(sb: any, evt: PaymentOutcome): Promise<{ ok: true } | { error: string }> {
  const { data: payment } = await sb
    .from("payments")
    .select("id, order_id, status")
    .eq("provider_ref", evt.providerRef)
    .maybeSingle();
  if (!payment) return { error: "payment_not_found" };
  if (payment.status === "paid" || payment.status === "refunded") return { ok: true }; // já aplicado

  await sb
    .from("payments")
    .update({ status: evt.status, raw: evt.raw, updated_at: new Date().toISOString() })
    .eq("id", payment.id);

  if (evt.status === "paid") {
    // Só avança se ainda aguardando — idempotência de estado do pedido.
    const { data: updated } = await sb
      .from("orders")
      .update({ status: "paid", payment_status: "paid" })
      .eq("id", payment.order_id)
      .eq("status", "awaiting_payment")
      .select("id");
    if (updated?.length) {
      await sb.from("order_events").insert({
        order_id: payment.order_id,
        label: "Pagamento aprovado",
        description: "Confirmado pelo provedor de pagamento.",
      });
    }
  } else if (evt.status === "failed") {
    await sb.from("orders").update({ payment_status: "failed" }).eq("id", payment.order_id);
    await sb.from("order_events").insert({
      order_id: payment.order_id,
      label: "Pagamento recusado",
      description: "O provedor recusou a transação.",
    });
  }
  return { ok: true };
}

/**
 * Ponto de entrada do webhook do provedor (assíncrono, fonte da verdade real).
 * Verifica a assinatura via a porta do provedor e aplica o desfecho (idempotente).
 */
export async function handleWebhook(rawBody: string, signature: string | null) {
  const provider = getPaymentProvider();
  const evt: PaymentOutcome = provider.parseWebhook(rawBody, signature); // lança se assinatura inválida
  const sb: any = createAdminClient();
  return applyOutcome(sb, evt);
}
