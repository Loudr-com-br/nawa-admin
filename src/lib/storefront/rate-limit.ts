import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Rate limiting por chave na Storefront (api-boundary §3.4). Janela fixa contada
// atomicamente no Postgres (função storefront_rate_hit) — correto sob concorrência
// e entre instâncias, ao contrário de um contador em memória por instância.
//
// Só conta requisições que chegam à função (cache miss); os hits do CDN nem
// invocam isto. O objetivo é proteger o backend/Postgres de abuso.

const LIMIT = Number(process.env.STOREFRONT_RATE_LIMIT ?? 120);
const WINDOW_SECONDS = Number(process.env.STOREFRONT_RATE_WINDOW_SECONDS ?? 60);

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
}

/**
 * Registra o hit e devolve o veredito. **Fail-open**: se o rate limiting falhar
 * (RPC indisponível), libera — uma falha do limitador nunca deve derrubar o
 * catálogo público.
 */
export async function enforceRateLimit(keyId: string): Promise<RateLimitResult> {
  const now = Date.now();
  const fallback: RateLimitResult = {
    allowed: true,
    limit: LIMIT,
    remaining: LIMIT,
    resetAt: new Date(now + WINDOW_SECONDS * 1000),
  };

  try {
    const sb = createAdminClient();
    const { data, error } = await sb.rpc("storefront_rate_hit", {
      p_key_id: keyId,
      p_limit: LIMIT,
      p_window_seconds: WINDOW_SECONDS,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row) return fallback;
    return {
      allowed: row.allowed,
      limit: LIMIT,
      remaining: row.remaining,
      resetAt: new Date(row.reset_at),
    };
  } catch {
    return fallback;
  }
}
