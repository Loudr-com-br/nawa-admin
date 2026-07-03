import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  scope: string;
  status: "active" | "revoked";
  lastUsedAt: string | null;
  createdAt: string;
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scope, status, last_used_at, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listApiKeys: ${error.message}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    keyPrefix: r.key_prefix ?? "",
    scope: r.scope,
    status: r.status,
    lastUsedAt: r.last_used_at,
    createdAt: r.created_at,
  }));
}
