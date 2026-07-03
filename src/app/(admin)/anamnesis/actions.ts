"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { ContentStatus } from "@/lib/catalog/types";
import type { Conditional, QuestionType } from "@/lib/anamnesis/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe um formulário com esse slug.";
  }
  return message;
}

// ── Formulários ──
export interface FormInput {
  name: string;
  slug: string;
  status: ContentStatus;
}

export async function saveForm(id: string | null, input: FormInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = { name: input.name.trim(), slug: input.slug.trim(), status: input.status };
  if (id) {
    const { error } = await supabase.from("anamnesis_forms").update(row).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error.message) };
    revalidatePath("/anamnesis");
    revalidatePath(`/anamnesis/${id}`);
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("anamnesis_forms").insert(row).select("id").single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/anamnesis");
  return { ok: true, id: data.id };
}

export async function deleteForm(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("anamnesis_forms").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/anamnesis");
  return { ok: true };
}

// ── Perguntas ──
export interface QuestionInput {
  formId: string;
  order: number;
  type: QuestionType;
  label: string;
  required: boolean;
  riskWeight: number;
  options: string[];
  conditional: Conditional;
}

export async function saveQuestion(id: string | null, input: QuestionInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    form_id: input.formId,
    order: input.order,
    type: input.type,
    label: input.label.trim(),
    required: input.required,
    risk_weight: input.riskWeight,
    options: input.options as Json,
    conditional_logic: (input.conditional ?? {}) as Json,
  };
  const { error } = id
    ? await supabase.from("anamnesis_questions").update(row).eq("id", id)
    : await supabase.from("anamnesis_questions").insert(row);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/anamnesis/${input.formId}`);
  return { ok: true };
}

export async function deleteQuestion(id: string, formId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("anamnesis_questions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/anamnesis/${formId}`);
  return { ok: true };
}

/** Persiste a nova ordem das perguntas (order = índice). */
export async function reorderQuestions(formId: string, orderedIds: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase.from("anamnesis_questions").update({ order: i }).eq("id", orderedIds[i]);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/anamnesis/${formId}`);
  return { ok: true };
}
