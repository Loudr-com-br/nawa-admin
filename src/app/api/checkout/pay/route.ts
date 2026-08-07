import { NextResponse } from "next/server";
import { authenticatePatient } from "@/lib/patient/auth";
import { payOrder } from "@/lib/payments/service";
import type { PaymentMethod } from "@/lib/payments/types";

// POST /api/checkout/pay — cobra um pedido `awaiting_payment` (spec §6.2).
// Auth: sessão do paciente (JWT); o escopo do pedido é resolvido no servidor.
// Não cacheável. Idempotente (pedido já pago não cobra de novo).
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function POST(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);

  let body: { orderId?: string; method?: PaymentMethod } | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body?.orderId) return json({ error: "orderId é obrigatório" }, 400);

  const result = await payOrder(session.patientId, body.orderId, body.method ?? "pix");
  if ("error" in result) {
    const code =
      result.error === "forbidden" ? 403 : result.error === "order_not_found" ? 404 : 400;
    return json(result, code);
  }
  return json(result);
}
