"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purgeCatalog } from "@/lib/storefront/purge";
import type { ContentStatus, ProductRefType } from "@/lib/catalog/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe um registro com esse slug.";
  }
  return message;
}

// ── Planos ──
export interface PlanInput {
  name: string;
  slug: string;
  journeyId: string | null;
  basePrice: number;
  billingInterval: string;
  inclusions: string[];
  status: ContentStatus;
}

export async function savePlan(id: string | null, input: PlanInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    journey_id: input.journeyId,
    base_price: input.basePrice,
    billing_interval: input.billingInterval,
    inclusions: input.inclusions,
    status: input.status,
  };
  const { error } = id
    ? await supabase.from("plans").update(row).eq("id", id)
    : await supabase.from("plans").insert(row);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

export async function deletePlan(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

// ── Produtos comerciais ──
export interface ProductInput {
  name: string;
  refType: ProductRefType;
  refId: string | null;
  price: number;
  isAddon: boolean;
  status: ContentStatus;
}

export async function saveProduct(id: string | null, input: ProductInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    ref_type: input.refType,
    ref_id: input.refId,
    price: input.price,
    is_addon: input.isAddon,
    status: input.status,
  };
  const { error } = id
    ? await supabase.from("commercial_products").update(row).eq("id", id)
    : await supabase.from("commercial_products").insert(row);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("commercial_products").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

/** Publica/despublica sem abrir o formulário — transição de estado deliberada. */
export async function setPlanStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

export async function setProductStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("commercial_products").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}
