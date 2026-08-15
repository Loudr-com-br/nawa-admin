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
    .select("name, email, phone, cpf")
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
        // O que veio na requisição tem precedência (o pagador pode ser outro, e o
        // titular do cartão é quem o provedor valida); o cadastro é a rede.
        document: opts.document ?? patient?.cpf ?? undefined,
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
 * Coloca o pedido na fila da revisão clínica (spec §7). Mora aqui, no lado do
 * pagamento, porque é o pagamento que dispara a entrada — e assim o grafo de
 * imports segue uma direção só: a revisão chama o pagamento, nunca o contrário.
 *
 * Guardado por estado: só entra vindo de `awaiting_payment`/`paid`, então webhook
 * repetido não puxa de volta um pedido já revisado ou já em produção.
 */
export async function enterClinicalReview(sb: any, orderId: string): Promise<void> {
  const { data: updated } = await sb
    .from("orders")
    .update({ status: "in_clinical_review" })
    .eq("id", orderId)
    .in("status", ["awaiting_payment", "paid"])
    .select("id");

  if (updated?.length) {
    await sb.from("order_events").insert({
      order_id: orderId,
      label: "Enviado para revisão clínica",
      description: "O protocolo aguarda validação de um profissional antes da produção.",
    });
  }
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

  // Autorizado: o limite do paciente está reservado, mas nada foi capturado. O
  // pedido segue para a revisão clínica — a captura só acontece se o protocolo for
  // aprovado (spec §7). É o que garante que ninguém paga por um protocolo recusado.
  if (evt.status === "authorized") {
    await sb
      .from("orders")
      .update({ payment_status: "authorized" })
      .eq("id", payment.order_id)
      .eq("status", "awaiting_payment");
    await sb.from("order_events").insert({
      order_id: payment.order_id,
      label: "Valor reservado",
      description: "O valor foi reservado no cartão. A cobrança só acontece após a validação clínica.",
    });
    await enterClinicalReview(sb, payment.order_id);
    return { ok: true };
  }

  if (evt.status === "paid") {
    // O FATO "foi pago" vale sempre, independente de onde o pedido está no fluxo.
    // Separado da transição abaixo porque, na pré-autorização, a captura acontece
    // com o pedido já fora de `awaiting_payment` — mantê-los juntos deixava o
    // pedido capturado exibindo "valor reservado" para sempre.
    await sb.from("orders").update({ payment_status: "paid" }).eq("id", payment.order_id);

    // A transição de ESTADO só acontece a partir de "aguardando pagamento" —
    // idempotência: webhook repetido não reabre um pedido que já andou.
    const { data: updated } = await sb
      .from("orders")
      .update({ status: "paid" })
      .eq("id", payment.order_id)
      .eq("status", "awaiting_payment")
      .select("id");
    if (updated?.length) {
      await sb.from("order_events").insert({
        order_id: payment.order_id,
        label: "Pagamento aprovado",
        description: "Confirmado pelo provedor de pagamento.",
      });
      // Pagar não libera produção: o pedido entra na fila clínica (spec §7). É o
      // que prometemos ao paciente na confirmação, e o que sustenta a posição de
      // plataforma agregadora — a responsabilidade clínica é de quem revisa.
      await enterClinicalReview(sb, payment.order_id);
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
 * Captura uma autorização — chamado quando a revisão clínica APROVA o protocolo.
 * Só aqui o dinheiro sai da conta do paciente.
 *
 * Sem autorização registrada (pedido cobrado direto, ou stub), devolve `skipped`:
 * o gate clínico não pode travar por causa do modelo de captura configurado.
 */
export async function captureAuthorizedPayment(
  orderId: string,
): Promise<{ ok: true; captured: boolean } | { error: string; detail?: string }> {
  const sb: any = createAdminClient();
  const { data: payment } = await sb
    .from("payments")
    .select("id, provider_ref, amount, status")
    .eq("order_id", orderId)
    .eq("status", "authorized")
    .maybeSingle();
  if (!payment) return { ok: true, captured: false };

  const provider = getPaymentProvider();
  if (!provider.capture) return { error: "provider_cannot_capture" };

  try {
    const outcome = await provider.capture({ providerRef: payment.provider_ref });
    await applyOutcome(sb, outcome);
    if (outcome.status === "paid") {
      await sb.from("order_events").insert({
        order_id: orderId,
        label: "Pagamento capturado",
        description: "O valor reservado foi cobrado após a aprovação clínica.",
      });
    }
    return { ok: true, captured: outcome.status === "paid" };
  } catch (e) {
    return { error: "capture_failed", detail: (e as Error).message };
  }
}

/**
 * Libera a autorização — chamado quando a revisão clínica REPROVA. Como nada foi
 * capturado, isso devolve o limite ao paciente sem existir estorno: o dinheiro
 * nunca saiu. É a razão de ter adotado pré-autorização.
 */
export async function releaseAuthorizedPayment(
  orderId: string,
): Promise<{ ok: true; released: boolean } | { error: string; detail?: string }> {
  const sb: any = createAdminClient();
  const { data: payment } = await sb
    .from("payments")
    .select("id, provider_ref, status")
    .eq("order_id", orderId)
    .in("status", ["authorized", "paid"])
    .maybeSingle();
  if (!payment) return { ok: true, released: false };

  const provider = getPaymentProvider();
  if (!provider.cancel) return { error: "provider_cannot_cancel" };

  try {
    const outcome = await provider.cancel({ providerRef: payment.provider_ref });
    await sb
      .from("payments")
      .update({ status: "refunded", raw: outcome.raw, updated_at: new Date().toISOString() })
      .eq("id", payment.id);
    await sb.from("orders").update({ payment_status: "refunded" }).eq("id", orderId);
    await sb.from("order_events").insert({
      order_id: orderId,
      label: payment.status === "authorized" ? "Valor liberado" : "Valor estornado",
      description:
        payment.status === "authorized"
          ? "A reserva foi cancelada no cartão. Nenhum valor foi cobrado."
          : "O valor cobrado foi devolvido.",
    });
    return { ok: true, released: true };
  } catch (e) {
    return { error: "release_failed", detail: (e as Error).message };
  }
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
