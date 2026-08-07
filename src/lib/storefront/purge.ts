import "server-only";

/** Tags de cache das respostas da Storefront (ver response.ts e os route handlers). */
export const STOREFRONT_TAGS = {
  items: "storefront-items",
  protocols: "storefront-protocols",
  collections: "storefront-collections",
  anamnesis: "storefront-anamnesis",
} as const;

const FRONT_URL = process.env.FRONT_REVALIDATE_URL ?? "";
const FRONT_SECRET = process.env.FRONT_REVALIDATE_SECRET ?? "";

/** Invalida o cache de borda da Netlify por tag (purge-on-publish). */
async function purgeEdge(tags: string[]): Promise<void> {
  try {
    const { purgeCache } = await import("@netlify/functions");
    await purgeCache({ tags });
  } catch {
    // sem runtime/token da Netlify (local ou outro host) — ignora
  }
}

/**
 * Fecha a coordenação de purge ponta a ponta (api-boundary §3.1): avisa o FRONT
 * para invalidar o cache dele (revalidateTag) com as mesmas tags. Best-effort e
 * com timeout — o publish NÃO trava se o front demorar/estiver fora (o cache do
 * front expira por tempo de qualquer forma). No-op se não configurado (local).
 */
async function notifyFront(tags: string[]): Promise<void> {
  if (!FRONT_URL || !FRONT_SECRET) return;
  try {
    await fetch(`${FRONT_URL}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": FRONT_SECRET },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // front indisponível/timeout — best-effort
  }
}

/**
 * Purga o cache das duas pontas por tag: borda da Netlify (backoffice) + cache
 * do front (revalidateTag via webhook). Best-effort nos dois — nunca quebra a ação.
 */
async function purge(tags: string[]): Promise<void> {
  await Promise.allSettled([purgeEdge(tags), notifyFront(tags)]);
}

// Mudança em item repercute em protocolos (preço/visibilidade do membro) e
// em coleções (membro/rollup). Purga em cascata para não servir dado velho.
export const purgeCatalog = () => purge([STOREFRONT_TAGS.items, STOREFRONT_TAGS.collections, STOREFRONT_TAGS.protocols]);
export const purgeProtocols = () => purge([STOREFRONT_TAGS.protocols, STOREFRONT_TAGS.collections]);
export const purgeAnamnesis = () => purge([STOREFRONT_TAGS.anamnesis]);
