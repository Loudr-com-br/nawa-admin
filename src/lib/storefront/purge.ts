import "server-only";

/** Tags de cache das respostas da Storefront (ver response.ts e os route handlers). */
export const STOREFRONT_TAGS = {
  catalog: "storefront-catalog",
  protocols: "storefront-protocols",
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

export const purgeCatalog = () => purge([STOREFRONT_TAGS.catalog]);
export const purgeProtocols = () => purge([STOREFRONT_TAGS.protocols]);
export const purgeAnamnesis = () => purge([STOREFRONT_TAGS.anamnesis]);
