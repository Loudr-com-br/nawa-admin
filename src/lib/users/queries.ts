import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/supabase/roles";

export interface InternalUser {
  id: string;
  email: string;
  role: AppRole;
  mfaEnabled: boolean;
  status: string;
  createdAt: string;
}

export async function listInternalUsers(): Promise<InternalUser[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users_internal")
    .select("id, email, role, mfa_enabled, status, created_at")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`listInternalUsers: ${error.message}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    mfaEnabled: r.mfa_enabled,
    status: r.status,
    createdAt: r.created_at,
  }));
}
