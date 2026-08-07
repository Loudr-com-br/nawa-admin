import { NextResponse } from "next/server";
import { CONTRACT, type ContractKey } from "./contract";
import type { RateLimitResult } from "./rate-limit";

/** Headers informativos de rate limit (convenção X-RateLimit-*). */
function rateLimitHeaders(rl: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt.getTime() / 1000)),
  };
}

/**
 * Resposta JSON da Storefront com cache no edge/CDN.
 *
 * O dado servido é sempre `published` e muda apenas em evento de publish, então
 * é seguro (e barato) cachear: o CDN absorve o grosso do tráfego e a maioria dos
 * acessos nem toca a função nem o Postgres.
 *
 * - `s-maxage=60`  → CDN serve do cache por 60s.
 * - `stale-while-revalidate=300` → serve o cache "velho" por até 5min enquanto
 *   revalida em background (nenhum usuário espera).
 * - `Vary: Authorization, x-api-key` → cache separado por chave; requisição sem
 *   chave nunca reaproveita um cache autenticado (cai na função e recebe 401).
 * - Sem cache no browser (`max-age=0`): a decisão de cache fica no CDN.
 *
 * Quando algo é publicado no backoffice, o ideal é purgar/revalidar essa chave
 * de cache (roadmap em `.spec/escalabilidade.md`).
 */
export function storefrontJson(
  data: unknown,
  cacheTag: string,
  contract?: ContractKey,
  rateLimit?: RateLimitResult,
) {
  // Auto-verificação de contrato (só fora de produção): se o backoffice produzir
  // um shape fora do contrato, falha ALTO no teste/CI. Em produção NÃO validamos —
  // um detalhe de schema jamais deve derrubar o catálogo público. Ver contract.ts.
  if (contract && process.env.NODE_ENV !== "production") {
    const result = CONTRACT[contract].safeParse(data);
    if (!result.success) {
      const issues = result.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      throw new Error(`[storefront] contrato '${contract}' violado — ${issues}`);
    }
  }

  const cache = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": cache,
      "Netlify-CDN-Cache-Control": cache,
      // Tag para purge seletivo no publish (ver lib/storefront/purge.ts).
      "Netlify-Cache-Tag": cacheTag,
      Vary: "Authorization, x-api-key",
      ...(rateLimit ? rateLimitHeaders(rateLimit) : {}),
    },
  });
}

/** Resposta 401 — nunca cacheada. */
export function storefrontUnauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: { "Cache-Control": "no-store" } }
  );
}

/** Resposta 429 — limite por chave estourado. Nunca cacheada; inclui Retry-After. */
export function storefrontRateLimited(rl: RateLimitResult) {
  const retryAfter = Math.max(1, Math.ceil((rl.resetAt.getTime() - Date.now()) / 1000));
  return NextResponse.json(
    { error: "rate_limited" },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(retryAfter),
        ...rateLimitHeaders(rl),
      },
    }
  );
}
