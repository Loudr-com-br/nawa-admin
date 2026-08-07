import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase/config";
//
// Auth do Painel do paciente (spec §6.3). Distinta da chave da Storefront:
// aqui a identidade é a SESSÃO do paciente (JWT do Supabase Auth), e o escopo
// (só os dados dele) é garantido NO SERVIDOR pelo auth_user_id — nunca por
// parâmetro na requisição.

export interface PatientSession {
  patientId: string;
  authUserId: string;
}

export interface AuthUser {
  authUserId: string;
  email: string;
}

/** Valida o Bearer JWT e devolve o usuário do Supabase Auth (sem exigir paciente). */
export async function authenticateAuthUser(request: Request): Promise<AuthUser | null> {
  const header = request.headers.get("authorization");
  const token = header?.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : null;
  if (!token) return null;
  const anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;
  return { authUserId: data.user.id, email: data.user.email ?? "" };
}

/** Valida o JWT do paciente e resolve o `patients.id`. Null se não há paciente. */
export async function authenticatePatient(request: Request): Promise<PatientSession | null> {
  const user = await authenticateAuthUser(request);
  if (!user) return null;

  // Resolve o paciente pelo vínculo auth_user_id (o escopo vem daqui, não do cliente).
  const admin = createAdminClient();
  const { data: patient } = await admin
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.authUserId)
    .maybeSingle();
  if (!patient) return null;

  return { patientId: patient.id, authUserId: user.authUserId };
}
