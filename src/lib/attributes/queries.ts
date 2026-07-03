import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Attribute } from "./types";

export async function listAttributes(): Promise<Attribute[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attributes")
    .select("id, scope, key, label, type, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listAttributes: ${error.message}`);
  return (data ?? []).map((r) => ({
    id: r.id,
    scope: r.scope,
    key: r.key,
    label: r.label,
    type: r.type,
    createdAt: r.created_at,
  }));
}
