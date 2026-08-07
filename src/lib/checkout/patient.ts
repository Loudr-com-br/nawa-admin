import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import type { AuthUser } from "@/lib/patient/auth";
//
// Guest → conta (spec §11): quando um paciente novo (auth user) fecha o pedido,
// criamos a linha em `patients` vinculada ao auth_user_id. Se já existe, reusa.
// É aqui que o convidado vira paciente de verdade (substitui o seed).

export async function resolveOrCreatePatient(user: AuthUser, name?: string): Promise<string> {
  const sb: any = createAdminClient();

  const { data: existing } = await sb
    .from("patients")
    .select("id")
    .eq("auth_user_id", user.authUserId)
    .maybeSingle();
  if (existing) return existing.id;

  // fallback de nome: o informado, ou o começo do email
  const fallbackName = (name?.trim() || user.email.split("@")[0] || "Paciente").slice(0, 120);

  const { data: created, error } = await sb
    .from("patients")
    .insert({
      auth_user_id: user.authUserId,
      name: fallbackName,
      email: user.email,
      consent_status: "granted", // consentiu ao criar a conta no checkout
    })
    .select("id")
    .single();
  if (error || !created) throw new Error(`resolveOrCreatePatient: ${error?.message ?? "sem retorno"}`);
  return created.id;
}
