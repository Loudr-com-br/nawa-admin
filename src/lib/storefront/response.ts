import { NextResponse } from "next/server";

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
export function storefrontJson(data: unknown, cacheTag: string) {
  const cache = "public, max-age=0, s-maxage=60, stale-while-revalidate=300";
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": cache,
      "Netlify-CDN-Cache-Control": cache,
      // Tag para purge seletivo no publish (ver lib/storefront/purge.ts).
      "Netlify-Cache-Tag": cacheTag,
      Vary: "Authorization, x-api-key",
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
