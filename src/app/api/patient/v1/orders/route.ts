import { NextResponse } from "next/server";
import { authenticatePatient } from "@/lib/patient/auth";
import { getPatientOrders } from "@/lib/patient/queries";

// GET /api/patient/orders — pedidos do próprio paciente (sessão, escopo server-side).
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function GET(request: Request) {
  const session = await authenticatePatient(request);
  if (!session) return json({ error: "unauthorized" }, 401);
  return json(await getPatientOrders(session.patientId));
}
