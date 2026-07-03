"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/storefront/keys";

export type ActionResult =
  | { ok: true; raw?: string }
  | { ok: false; error: string };

async function currentUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Cria uma chave; retorna o texto puro UMA vez (só o hash é guardado). */
export async function createKey(name: string): Promise<ActionResult> {
  if (!name.trim()) return { ok: false, error: "Dê um nome para a chave." };
  const supabase = await createClient();
  const { raw, hash, prefix } = generateApiKey();
  const { error } = await supabase.from("api_keys").insert({
    name: name.trim(),
    key_hash: hash,
    key_prefix: prefix,
    scope: "read",
    status: "active",
    created_by: await currentUserId(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/api-keys");
  return { ok: true, raw };
}

export async function revokeKey(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/api-keys");
  return { ok: true };
}

/** Rotaciona: cria uma nova chave com o mesmo nome e revoga a antiga. */
export async function rotateKey(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: old, error: readErr } = await supabase
    .from("api_keys")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  if (readErr || !old) return { ok: false, error: readErr?.message ?? "Chave não encontrada." };

  const { raw, hash, prefix } = generateApiKey();
  const { error: insErr } = await supabase.from("api_keys").insert({
    name: old.name,
    key_hash: hash,
    key_prefix: prefix,
    scope: "read",
    status: "active",
    created_by: await currentUserId(),
  });
  if (insErr) return { ok: false, error: insErr.message };

  const { error: revErr } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
  if (revErr) return { ok: false, error: revErr.message };

  revalidatePath("/api-keys");
  return { ok: true, raw };
}
