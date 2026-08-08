import "server-only";
import { NextResponse } from "next/server";
import { authenticateStorefront } from "./auth";
import { enforceRateLimit, type RateLimitResult } from "./rate-limit";
import { storefrontJson, storefrontUnauthorized, storefrontRateLimited } from "./response";
import { logStorefront } from "./observe";
import type { ContractKey } from "./contract";

// Porta de entrada das rotas de leitura da Storefront: valida a chave, aplica o
// rate limit por chave e instrumenta (latência/status/erros por chave). Retorna
// a resposta de erro pronta (401/429) ou o resultado do rate limit p/ os headers.

export type StorefrontGuard =
  | { ok: false; status: number; keyId: string | null; response: NextResponse }
  | { ok: true; keyId: string; rateLimit: RateLimitResult };

export async function guardStorefront(request: Request): Promise<StorefrontGuard> {
  const key = await authenticateStorefront(request);
  if (!key) return { ok: false, status: 401, keyId: null, response: storefrontUnauthorized() };

  const rateLimit = await enforceRateLimit(key.keyId);
  if (!rateLimit.allowed) {
    return { ok: false, status: 429, keyId: key.keyId, response: storefrontRateLimited(rateLimit) };
  }
  return { ok: true, keyId: key.keyId, rateLimit };
}

/**
 * Serve uma rota de leitura da Storefront ponta a ponta: guard (auth + rate limit)
 * → `load()` (a query) → resposta cacheável com headers de rate limit → log
 * estruturado (path, chave, status, latência). Centraliza o que era repetido em
 * cada rota e adiciona a observabilidade num único ponto (api-boundary §3.4).
 */
export async function serveStorefront(
  request: Request,
  opts: { tag: string; contract: ContractKey },
  load: () => Promise<unknown>,
): Promise<NextResponse> {
  const startedAt = Date.now();
  const path = new URL(request.url).pathname;

  const guard = await guardStorefront(request);
  if (!guard.ok) {
    logStorefront({ path, keyId: guard.keyId, status: guard.status, ms: Date.now() - startedAt });
    return guard.response;
  }

  try {
    const data = await load();
    const res = storefrontJson(data, opts.tag, opts.contract, guard.rateLimit);
    logStorefront({
      path,
      keyId: guard.keyId,
      status: 200,
      ms: Date.now() - startedAt,
      rateRemaining: guard.rateLimit.remaining,
    });
    return res;
  } catch (err) {
    logStorefront({ path, keyId: guard.keyId, status: 500, ms: Date.now() - startedAt, error: (err as Error).message });
    throw err;
  }
}
