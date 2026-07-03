import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Promotion } from "./types";

export async function listPromotions(): Promise<Promotion[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promotions")
    .select("id, code, type, value, valid_from, valid_to, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listPromotions: ${error.message}`);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((r: any) => ({
    id: r.id,
    code: r.code,
    type: r.type,
    value: Number(r.value),
    validFrom: r.valid_from,
    validTo: r.valid_to,
    status: r.status,
    createdAt: r.created_at,
  }));
}
