"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContentStatus } from "@/lib/catalog/types";
import type { PromotionType } from "@/lib/promotions/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("promotions_code")) {
    return "Já existe uma promoção com esse código.";
  }
  return message;
}

export interface PromotionInput {
  code: string;
  type: PromotionType;
  value: number;
  validFrom: string | null;
  validTo: string | null;
  status: ContentStatus;
}

export async function savePromotion(id: string | null, input: PromotionInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    code: input.code.trim().toUpperCase(),
    type: input.type,
    value: input.value,
    valid_from: input.validFrom || null,
    valid_to: input.validTo || null,
    status: input.status,
  };
  const { error } = id
    ? await supabase.from("promotions").update(row).eq("id", id)
    : await supabase.from("promotions").insert(row);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/promotions");
  return { ok: true };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/promotions");
  return { ok: true };
}
