import { NextResponse } from "next/server";
import { authenticatePatient } from "@/lib/patient/auth";
import { getPatientSubscriptions } from "@/lib/patient/queries";

// GET /api/patient/subscriptions — assinaturas do próprio paciente.
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function GET(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);
  return json(await getPatientSubscriptions(session.patientId));
}
