import { NextResponse } from "next/server";
import { enforceWriteLimit } from "@/lib/api/rate-limit";
import { handleWebhook } from "@/lib/payments/service";

// POST /api/payments/webhook — desfecho assíncrono do provedor (fonte da verdade).
// Sem JWT de paciente: autentica pela assinatura do provedor. Idempotente por
// provider_ref. Middleware libera /api/payments.
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  // Sem sessão para identificar: conta por IP. Generoso de propósito — o
  // provedor legitimamente reenvia eventos em lote, e recusar um webhook real
  // custa mais caro do que absorver um pico. Serve só para conter flood.
  const limite = await enforceWriteLimit(request, "payments:webhook", null, { limit: 240 });
  if (limite) return limite;

  const raw = await request.text();
  // Cada provedor autentica de um jeito: o stub manda um segredo em header próprio;
  // o Pagar.me v5 usa HTTP Basic (usuário/senha cadastrados no painel deles). Quem
  // sabe validar é o adapter — aqui só entregamos o material.
  const signature =
    request.headers.get("x-webhook-signature") ??
    request.headers.get("x-stub-signature") ??
    request.headers.get("authorization");
  try {
    const result = await handleWebhook(raw, signature);
    if ("error" in result) {
      return NextResponse.json(result, { status: 400, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true }, { headers: NO_STORE });
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401, headers: NO_STORE });
  }
}
