/** Config compartilhada do Supabase e detecção de ambiente. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Verdadeiro quando as variáveis públicas estão presentes.
 * Enquanto for falso, o app roda em modo mock (sem auth), sem quebrar o build
 * nem o browsing local. A proteção de rotas só é aplicada quando configurado.
 */
export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
