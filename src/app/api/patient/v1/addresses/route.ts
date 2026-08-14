import { NextResponse } from "next/server";
import { authenticatePatient } from "@/lib/patient/auth";
import { listAddresses, createAddress, type AddressInput } from "@/lib/patient/addresses";

// GET|POST /api/patient/v1/addresses — agenda de endereços do paciente (spec §6.3).
// Auth: JWT do paciente; o dono é resolvido no servidor, nunca por parâmetro.
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function GET(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);
  return json({ addresses: await listAddresses(session.patientId) });
}

export async function POST(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);

  let body: AddressInput | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body) return json({ error: "corpo obrigatório" }, 400);

  const result = await createAddress(session.patientId, body);
  if ("error" in result) return json(result, 400);
  return json(result, 201);
}
