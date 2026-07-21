import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Item, ItemCaution, SupplierOption } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ITEM_SELECT =
  "id, slug, name, supplier_id, external_ref, item_type, pharmaceutical_form, " +
  "description, composition, cautions, cost, price, is_glp1, sells_standalone, " +
  "visibility, status, synced_at, created_at, updated_at, " +
  "supplier:suppliers(name, type, slug)";

function toItem(r: any): Item {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    supplierId: r.supplier_id,
    supplierName: r.supplier?.name ?? "—",
    supplierType: r.supplier?.type ?? "internal",
    supplierSlug: r.supplier?.slug ?? "",
    externalRef: r.external_ref,
    itemType: r.item_type,
    pharmaceuticalForm: r.pharmaceutical_form,
    description: r.description,
    composition: (r.composition ?? {}) as Record<string, unknown>,
    cautions: Array.isArray(r.cautions) ? (r.cautions as ItemCaution[]) : [],
    cost: r.cost == null ? null : Number(r.cost),
    price: Number(r.price),
    isGlp1: r.is_glp1,
    sellsStandalone: r.sells_standalone,
    visibility: r.visibility,
    status: r.status,
    syncedAt: r.synced_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listItems(): Promise<Item[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .order("name");
  if (error) throw new Error(`listItems: ${error.message}`);
  return (data ?? []).map(toItem);
}

export async function getItemById(id: string): Promise<Item | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getItemById: ${error.message}`);
  return data ? toItem(data) : null;
}

/** Fornecedores para o select do formulário de novo item. */
export async function listSuppliers(): Promise<SupplierOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, slug, name, type")
    .eq("status", "active")
    .order("name");
  if (error) throw new Error(`listSuppliers: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id, slug: r.slug, name: r.name, type: r.type,
  }));
}
