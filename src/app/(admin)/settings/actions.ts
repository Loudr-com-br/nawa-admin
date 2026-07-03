"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/supabase/auth";
import type { AppRole } from "@/lib/supabase/roles";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Garante que quem chama é super_admin (defesa em profundidade). */
async function requireSuperAdmin(): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (user?.role !== "super_admin") {
    return { ok: false, error: "Ação restrita ao super admin." };
  }
  return { ok: true };
}

/**
 * Convida um usuário interno: cria (ou reaproveita) o usuário no Auth e grava
 * o papel em users_internal. Não envia e-mail — o usuário define a senha via
 * "Esqueci a senha". Usa o client admin (bypassa RLS).
 */
export async function inviteUser(email: string, role: AppRole): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard;

  const clean = email.trim().toLowerCase();
  if (!clean) return { ok: false, error: "Informe um e-mail." };

  const admin = createAdminClient();

  // Procura usuário existente no Auth.
  let userId: string | null = null;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { ok: false, error: error.message };
    const found = data.users.find((u) => u.email?.toLowerCase() === clean);
    if (found) { userId = found.id; break; }
    if (data.users.length < 200) break;
  }

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: clean,
      email_confirm: true,
      password: randomBytes(18).toString("base64url"),
    });
    if (error) return { ok: false, error: error.message };
    userId = data.user.id;
  }

  const { error: upErr } = await admin
    .from("users_internal")
    .upsert({ id: userId, email: clean, role, status: "active" }, { onConflict: "id" });
  if (upErr) return { ok: false, error: upErr.message };

  revalidatePath("/settings");
  return { ok: true };
}

export async function setUserRole(id: string, role: AppRole): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard;
  const supabase = await createClient();
  const { error } = await supabase.from("users_internal").update({ role }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}

export async function setUserStatus(id: string, status: "active" | "inactive"): Promise<ActionResult> {
  const guard = await requireSuperAdmin();
  if (!guard.ok) return guard;
  const supabase = await createClient();
  const { error } = await supabase.from("users_internal").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings");
  return { ok: true };
}
