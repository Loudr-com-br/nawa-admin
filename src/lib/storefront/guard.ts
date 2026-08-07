import "server-only";
import type { NextResponse } from "next/server";
import { authenticateStorefront } from "./auth";
import { enforceRateLimit, type RateLimitResult } from "./rate-limit";
import { storefrontUnauthorized, storefrontRateLimited } from "./response";

// Porta de entrada das rotas de leitura da Storefront: valida a chave e aplica
// o rate limit por chave numa tacada. Retorna a resposta de erro pronta (401/429)
// ou o resultado do rate limit p/ os headers X-RateLimit-* na resposta 200.

export type StorefrontGuard =
  | { ok: false; response: NextResponse }
  | { ok: true; rateLimit: RateLimitResult };

export async function guardStorefront(request: Request): Promise<StorefrontGuard> {
  const key = await authenticateStorefront(request);
  if (!key) return { ok: false, response: storefrontUnauthorized() };

  const rateLimit = await enforceRateLimit(key.keyId);
  if (!rateLimit.allowed) return { ok: false, response: storefrontRateLimited(rateLimit) };

  return { ok: true, rateLimit };
}
