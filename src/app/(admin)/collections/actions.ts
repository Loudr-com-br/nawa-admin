"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purgeCatalog } from "@/lib/storefront/purge";
import type { ContentStatus } from "@/lib/catalog/types";
import type { CollectionVisibility, CollectionRefType } from "@/lib/collections/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") && message.includes("collection_members")) {
    return "Este membro já está na coleção.";
  }
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe uma coleção com esse slug.";
  }
  if (message.includes("foreign key") || message.includes("violates foreign key")) {
    return "Esta coleção tem subcoleções — mova ou exclua os filhos antes.";
  }
  return message;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** parentId não pode ser a própria coleção nem um descendente dela (proíbe ciclo §15). */
async function wouldCycle(supabase: any, id: string, parentId: string | null): Promise<boolean> {
  if (!parentId) return false;
  if (parentId === id) return true;
  const { data: all } = await supabase.from("collections").select("id, parent_id");
  const childrenOf = new Map<string | null, string[]>();
  for (const c of all ?? []) {
    if (!childrenOf.has(c.parent_id)) childrenOf.set(c.parent_id, []);
    childrenOf.get(c.parent_id)!.push(c.id);
  }
  const stack = [...(childrenOf.get(id) ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (cur === parentId) return true;
    stack.push(...(childrenOf.get(cur) ?? []));
  }
  return false;
}

export interface CollectionInput {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
  visibility: CollectionVisibility;
  status: ContentStatus;
}

export async function createCollection(input: {
  name: string;
  slug: string;
  description: string;
  parentId: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim() || null,
      parent_id: input.parentId,
      visibility: "internal",
      status: "draft",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/collections");
  await purgeCatalog();
  return { ok: true, id: data.id };
}

export async function saveCollection(id: string, input: CollectionInput): Promise<ActionResult> {
  const supabase = await createClient();
  if (await wouldCycle(supabase, id, input.parentId)) {
    return { ok: false, error: "Uma coleção não pode ser filha de si mesma ou de uma subcoleção sua." };
  }
  const { error } = await supabase
    .from("collections")
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description.trim() || null,
      parent_id: input.parentId,
      visibility: input.visibility,
      status: input.status,
    })
    .eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  await purgeCatalog();
  return { ok: true, id };
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/collections");
  await purgeCatalog();
  return { ok: true };
}

export async function addMember(
  collectionId: string,
  refType: CollectionRefType,
  refId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("collection_members")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", collectionId);
  const { error } = await supabase.from("collection_members").insert({
    collection_id: collectionId,
    ref_type: refType,
    ref_id: refId,
    order: count ?? 0,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/collections/${collectionId}`);
  await purgeCatalog();
  return { ok: true };
}

export async function removeMember(memberId: string, collectionId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("collection_members").delete().eq("id", memberId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/collections/${collectionId}`);
  await purgeCatalog();
  return { ok: true };
}

export async function setCollectionStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("collections").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  await purgeCatalog();
  return { ok: true };
}
