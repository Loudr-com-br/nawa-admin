import "server-only";

/** Tags de cache das respostas da Storefront (ver response.ts e os route handlers). */
export const STOREFRONT_TAGS = {
  items: "storefront-items",
  protocols: "storefront-protocols",
  collections: "storefront-collections",
  anamnesis: "storefront-anamnesis",
} as const;

/**
 * Invalida o cache de borda da Netlify por tag (purge-on-publish).
 * Best-effort: fora do runtime Netlify (ex: local) é no-op e nunca quebra a ação.
 */
async function purge(tags: string[]): Promise<void> {
  try {
    const { purgeCache } = await import("@netlify/functions");
    await purgeCache({ tags });
  } catch {
    // sem runtime/token da Netlify (local ou outro host) — ignora
  }
}

// Mudança em item repercute em protocolos (preço/visibilidade do membro) e
// em coleções (membro/rollup). Purga em cascata para não servir dado velho.
export const purgeCatalog = () => purge([STOREFRONT_TAGS.items, STOREFRONT_TAGS.collections, STOREFRONT_TAGS.protocols]);
export const purgeProtocols = () => purge([STOREFRONT_TAGS.protocols, STOREFRONT_TAGS.collections]);
export const purgeAnamnesis = () => purge([STOREFRONT_TAGS.anamnesis]);
