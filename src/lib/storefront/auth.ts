import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "./keys";

/** Extrai a chave do header (Bearer ou x-api-key). */
export function extractKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  const x = request.headers.get("x-api-key");
  return x?.trim() || null;
}

/**
 * Valida a chave da Storefront. Retorna true se ativa; registra last_used_at.
 * Usa o client admin (bypassa RLS) — a Storefront não tem sessão Supabase.
 */
export async function authenticateStorefront(request: Request): Promise<boolean> {
  const raw = extractKey(request);
  if (!raw) return false;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, status")
    .eq("key_hash", hashApiKey(raw))
    .maybeSingle();

  if (!data || data.status !== "active") return false;

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id);

  return true;
}
