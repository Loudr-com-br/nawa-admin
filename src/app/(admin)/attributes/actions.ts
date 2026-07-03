"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AttributeScope } from "@/lib/attributes/types";

export interface AttributeInput {
  scope: AttributeScope;
  key: string;
  label: string;
  type: string;
}

export type ActionResult = { ok: true } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("attributes_scope_key")) {
    return "Já existe um atributo com essa chave neste escopo.";
  }
  return message;
}

export async function createAttribute(input: AttributeInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("attributes").insert({
    scope: input.scope,
    key: input.key.trim(),
    label: input.label.trim(),
    type: input.type,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/attributes");
  return { ok: true };
}

export async function updateAttribute(
  id: string,
  input: AttributeInput
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("attributes")
    .update({
      scope: input.scope,
      key: input.key.trim(),
      label: input.label.trim(),
      type: input.type,
    })
    .eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/attributes");
  return { ok: true };
}

export async function deleteAttribute(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("attributes").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/attributes");
  return { ok: true };
}
