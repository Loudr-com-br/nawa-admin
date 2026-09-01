import { NextResponse } from "next/server";
import { enforceWriteLimit } from "@/lib/api/rate-limit";
import { authenticateAuthUser } from "@/lib/patient/auth";
import { resolveOrCreatePatient } from "@/lib/checkout/patient";

// POST /api/checkout/v1/patient — materializa o `patients` do guest→conta.
//
// Existe porque a conta nasce no bloco 1 do checkout (Dados) e o pedido só no
// bloco 3 (Pagamento). Antes disto o `patients` só era criado junto do pedido,
// então no bloco 2 (Entrega) todo cliente novo tinha JWT válido e nenhuma linha
// em `patients` — e `authenticatePatient` recusa exatamente esse estado, o que
// dava 401 ao salvar endereço em TODO cadastro novo.
//
// Idempotente: `resolveOrCreatePatient` reusa a linha existente e só completa os
// campos em branco, então chamar de novo (ou junto do pedido) não duplica nada.
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function POST(request: Request) {
  const user = await authenticateAuthUser(request);
  if (!user) return json({ error: "unauthorized" }, 401);

  const limite = await enforceWriteLimit(request, "checkout:patient", user.authUserId);
  if (limite) return limite;

  // Corpo é opcional — o cadastro pode ser completado depois, no pedido.
  let body: { name?: string; cpf?: string; phone?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const patientId = await resolveOrCreatePatient(user, body?.name, body?.cpf, body?.phone);
  return json({ patientId });
}
