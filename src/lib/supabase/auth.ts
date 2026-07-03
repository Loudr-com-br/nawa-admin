import { createClient } from "./server";
import { isSupabaseConfigured } from "./config";
import type { AppRole } from "./roles";

export interface CurrentUser {
  email: string;
  role: AppRole | null;
}

/**
 * Usuário interno logado + papel. Null quando não há sessão
 * ou quando o Supabase ainda não está configurado (modo mock).
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users_internal")
    .select("role")
    .eq("id", user.id)
    .single();

  return { email: user.email ?? "", role: (data?.role as AppRole) ?? null };
}
