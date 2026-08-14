import { NextResponse } from "next/server";
import { authenticatePatient } from "@/lib/patient/auth";
import { updateAddress, deleteAddress, type AddressInput } from "@/lib/patient/addresses";

// PATCH|DELETE /api/patient/v1/addresses/[id] — editar e apagar (spec §6.3).
// O escopo é do servidor: as queries filtram por patient_id do JWT, então um id
// de outro paciente devolve 404 em vez de vazar existência.
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;

  let body: Partial<AddressInput> | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body) return json({ error: "corpo obrigatório" }, 400);

  const result = await updateAddress(session.patientId, id, body);
  if ("error" in result) return json(result, result.error === "not_found" ? 404 : 400);
  return json(result);
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);
  const { id } = await ctx.params;

  const result = await deleteAddress(session.patientId, id);
  if ("error" in result) return json(result, result.error === "not_found" ? 404 : 400);
  return json(result);
}
