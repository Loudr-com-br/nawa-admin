"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purgeProtocols } from "@/lib/storefront/purge";
import type { ContentStatus } from "@/lib/catalog/types";
import type { PharmaceuticalForm, Supplier } from "@/lib/protocols/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe um protocolo com esse slug.";
  }
  return message;
}

// ── Protocolos ──
export interface ProtocolInput {
  name: string;
  slug: string;
  clinicalDescription: string;
  externalRef: string | null;
  status: ContentStatus;
}

export async function saveProtocol(
  id: string | null,
  input: ProtocolInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    clinical_description: input.clinicalDescription.trim() || null,
    external_ref: input.externalRef?.trim() || null,
    status: input.status,
  };
  if (id) {
    const { error } = await supabase.from("protocols").update(row).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error.message) };
    revalidatePath("/protocols");
  await purgeProtocols();
    revalidatePath(`/protocols/${id}`);
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("protocols").insert(row).select("id").single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  await purgeProtocols();
  return { ok: true, id: data.id };
}

export async function deleteProtocol(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("protocols").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  await purgeProtocols();
  return { ok: true };
}

// ── Fórmulas ──
export interface FormulaInput {
  protocolId: string;
  name: string;
  pharmaceuticalForm: PharmaceuticalForm;
  dosage: string;
  supplier: Supplier;
  isGlp1: boolean;
  externalRef: string | null;
  eligibilityNotes: string;
}

export async function saveFormula(
  id: string | null,
  input: FormulaInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    protocol_id: input.protocolId,
    name: input.name.trim(),
    pharmaceutical_form: input.pharmaceuticalForm,
    dosage: input.dosage.trim() || null,
    supplier: input.supplier,
    is_glp1: input.isGlp1,
    external_ref: input.externalRef?.trim() || null,
    eligibility_rules: { notes: input.eligibilityNotes.trim() },
  };
  const { error } = id
    ? await supabase.from("formulas").update(row).eq("id", id)
    : await supabase.from("formulas").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/protocols/${input.protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

export async function deleteFormula(id: string, protocolId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("formulas").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}
