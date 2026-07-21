"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purgeCatalog } from "@/lib/storefront/purge";
import {
  forcesMedicalOnly,
  type ContentStatus,
  type ItemType,
  type PharmaceuticalForm,
  type Visibility,
} from "@/lib/catalog/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe um item com esse slug.";
  }
  if (message.includes("foreign key") || message.includes("violates foreign key")) {
    return "Este item está em uso (protocolo ou pedido) e não pode ser excluído.";
  }
  return message;
}

export interface ItemInput {
  name: string;
  slug: string;
  supplierId: string; // usado só na criação
  itemType: ItemType;
  visibility: Visibility;
  sellsStandalone: boolean;
  isGlp1: boolean;
  price: number;
  // Propriedade do fornecedor — só aplicados se o fornecedor for interno (§9).
  pharmaceuticalForm: PharmaceuticalForm;
  description: string | null;
  cost: number | null;
  externalRef: string | null;
  compositionRaw: string | null;
  status: ContentStatus;
}

/** Campos que a NAWA sempre pode escrever. */
function nawaFields(input: ItemInput) {
  // Regra dura §7: medicamento é sempre medical_only.
  const visibility = forcesMedicalOnly(input.itemType) ? "medical_only" : input.visibility;
  return {
    name: input.name.trim(),
    slug: input.slug.trim(),
    item_type: input.itemType,
    visibility,
    sells_standalone: input.sellsStandalone,
    is_glp1: input.isGlp1,
    price: input.price,
    status: input.status,
  };
}

/** Campos de propriedade do fornecedor — editáveis só quando o fornecedor é interno. */
function supplierFields(input: ItemInput) {
  return {
    pharmaceutical_form: input.pharmaceuticalForm,
    description: input.description?.trim() || null,
    cost: input.cost,
    external_ref: input.externalRef?.trim() || null,
    composition: input.compositionRaw?.trim()
      ? { raw: input.compositionRaw.trim() }
      : {},
  };
}

export async function saveItem(id: string | null, input: ItemInput): Promise<ActionResult> {
  const supabase = await createClient();

  // Guarda de publicação: item publicado precisa de preço (§6).
  if (input.status === "published" && (!input.price || input.price <= 0)) {
    return { ok: false, error: "Defina um preço antes de publicar o item." };
  }

  if (!id) {
    // Criação — grava tudo (fornecedor definido no ato).
    const row = { supplier_id: input.supplierId, ...nawaFields(input), ...supplierFields(input) };
    const { error } = await supabase.from("items").insert(row);
    if (error) return { ok: false, error: friendlyError(error.message) };
  } else {
    // Edição — descobre se o fornecedor é externo para não sobrescrever o dado dele.
    const { data: current, error: readErr } = await supabase
      .from("items")
      .select("supplier:suppliers(type)")
      .eq("id", id)
      .maybeSingle();
    if (readErr) return { ok: false, error: friendlyError(readErr.message) };
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const supplierType = (current as any)?.supplier?.type ?? "internal";
    const isInternal = supplierType === "internal";

    const row = isInternal
      ? { ...nawaFields(input), ...supplierFields(input) }
      : nawaFields(input);
    const { error } = await supabase.from("items").update(row).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error.message) };
  }

  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

/** Publica/despublica sem abrir o formulário — transição de estado deliberada. */
export async function setItemStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  const supabase = await createClient();
  if (status === "published") {
    const { data, error } = await supabase.from("items").select("price").eq("id", id).maybeSingle();
    if (error) return { ok: false, error: friendlyError(error.message) };
    if (!data || Number(data.price) <= 0) {
      return { ok: false, error: "Defina um preço antes de publicar o item." };
    }
  }
  const { error } = await supabase.from("items").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/catalog");
  await purgeCatalog();
  return { ok: true };
}
