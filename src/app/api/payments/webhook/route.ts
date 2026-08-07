import { NextResponse } from "next/server";
import { handleWebhook } from "@/lib/payments/service";

// POST /api/payments/webhook — desfecho assíncrono do provedor (fonte da verdade).
// Sem JWT de paciente: autentica pela assinatura do provedor. Idempotente por
// provider_ref. Middleware libera /api/payments.
const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  const raw = await request.text();
  const signature =
    request.headers.get("x-webhook-signature") ?? request.headers.get("x-stub-signature");
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
