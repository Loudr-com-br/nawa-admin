import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { SUPABASE_URL } from "./config";

/**
 * Client com a service/secret key — bypassa RLS. SOMENTE server-side.
 * Usado pela Storefront API (o front não tem sessão Supabase; autentica por
 * chave própria) e por rotinas administrativas. Nunca importar no client.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient<Database>(SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
