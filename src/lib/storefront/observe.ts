import "server-only";

// Observabilidade da fronteira (api-boundary §3.4). Emite UMA linha estruturada
// (JSON) por request da Storefront, prefixada com [storefront] para filtrar no
// drain de logs (Netlify/observabilidade). Dá, por chave: latência, status,
// hit-rate implícito (200 vs 401/429/500) e erros. Sem backend de métricas ainda
// — o log estruturado é o primeiro degrau, agregável por qualquer coletor.

export interface StorefrontLog {
  path: string;
  status: number;
  ms: number;
  keyId?: string | null;
  rateRemaining?: number;
  error?: string;
}

export function logStorefront(fields: StorefrontLog): void {
  // Uma linha por request; JSON p/ parsing no coletor. Nunca lança.
  try {
    console.log(`[storefront] ${JSON.stringify({ at: new Date().toISOString(), ...fields })}`);
  } catch {
    // logging é best-effort — jamais afeta a resposta
  }
}
