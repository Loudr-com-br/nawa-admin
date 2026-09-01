import { NextResponse } from "next/server";
import { enforceWriteLimit } from "@/lib/api/rate-limit";
import { authenticatePatient } from "@/lib/patient/auth";
import { payOrder } from "@/lib/payments/service";
import type { BillingAddress, PaymentMethod } from "@/lib/payments/types";

// POST /api/checkout/v1/pay — cobra um pedido `awaiting_payment` (spec §6.2).
// Auth: sessão do paciente (JWT); o escopo do pedido é resolvido no servidor.
// Não cacheável. Idempotente (pedido já pago não cobra de novo).
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

interface PayBody {
  orderId?: string;
  method?: PaymentMethod;
  /** Token do cartão gerado no navegador — o número do cartão nunca passa por aqui. */
  paymentToken?: string;
  installments?: number;
  document?: string;
  phone?: string;
  billingAddress?: BillingAddress;
}

export async function POST(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);

  // Tentativa de cobrança é o alvo clássico de varredura de cartão: limite
  // menor que o das demais escritas. Conta por paciente, não por IP — quem
  // está autenticado não deve ser punido por dividir a rede com outros.
  const limite = await enforceWriteLimit(request, "checkout:pay", session.patientId, { limit: 8 });
  if (limite) return limite;

  let body: PayBody | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body?.orderId) return json({ error: "orderId é obrigatório" }, 400);

  const result = await payOrder(session.patientId, body.orderId, body.method ?? "pix", {
    paymentToken: body.paymentToken,
    installments: body.installments,
    document: body.document,
    phone: body.phone,
    billingAddress: body.billingAddress,
  });
  if ("error" in result) {
    const code =
      result.error === "forbidden"
        ? 403
        : result.error === "order_not_found"
          ? 404
          : result.error === "payment_provider_error"
            ? 502
            : 400;
    return json(result, code);
  }
  return json(result);
}
