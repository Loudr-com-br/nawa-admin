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
 * Só regrava `last_used_at` se o último registro for mais antigo que isto —
 * evita uma escrita no banco por request (write amplification que não escala).
 */
const LAST_USED_THROTTLE_MS = 5 * 60 * 1000;

/**
 * Valida a chave da Storefront. Retorna `{ keyId }` se ativa, senão `null`.
 * Usa o client admin (bypassa RLS) — a Storefront não tem sessão Supabase.
 * `last_used_at` é atualizado no máximo a cada 5 min (throttle).
 *
 * O `keyId` alimenta o rate limiting por chave (ver rate-limit.ts). Callers que
 * só precisam do sim/não usam `if (!(await authenticateStorefront(req)))` — segue
 * funcionando (objeto é truthy, null é falsy).
 */
export async function authenticateStorefront(request: Request): Promise<{ keyId: string } | null> {
  const raw = extractKey(request);
  if (!raw) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_keys")
    .select("id, status, last_used_at")
    .eq("key_hash", hashApiKey(raw))
    .maybeSingle();

  if (!data || data.status !== "active") return null;

  const last = data.last_used_at ? new Date(data.last_used_at).getTime() : 0;
  if (Date.now() - last > LAST_USED_THROTTLE_MS) {
    await supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", data.id);
  }

  return { keyId: data.id };
}
