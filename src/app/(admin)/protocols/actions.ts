"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { purgeProtocols } from "@/lib/storefront/purge";
import type { ContentStatus, Visibility } from "@/lib/catalog/types";
import type { ClaimStatus } from "@/lib/protocols/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") && message.includes("protocol_items")) {
    return "Este item já está no protocolo.";
  }
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe um protocolo com esse slug.";
  }
  return message;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Soma atual dos itens (preço × quantidade) do protocolo. */
async function currentSum(supabase: any, protocolId: string): Promise<number> {
  const { data } = await supabase
    .from("protocol_items")
    .select("quantity, item:items(price)")
    .eq("protocol_id", protocolId);
  return (data ?? []).reduce(
    (s: number, pi: any) => s + Number(pi.item?.price ?? 0) * (pi.quantity ?? 0),
    0
  );
}

/**
 * Piso de visibilidade (§7): se qualquer item é medical_only, o protocolo é
 * forçado a medical_only. Nunca *abaixa* a restrição sozinho — só sobe.
 * `desired` (opcional) é a escolha do operador quando não há item restrito.
 */
async function enforceVisibilityFloor(
  supabase: any,
  protocolId: string,
  desired?: Visibility
): Promise<Visibility> {
  const { data } = await supabase
    .from("protocol_items")
    .select("item:items(visibility)")
    .eq("protocol_id", protocolId);
  const hasMedical = (data ?? []).some((pi: any) => pi.item?.visibility === "medical_only");

  let target: Visibility;
  if (hasMedical) {
    target = "medical_only";
  } else if (desired) {
    target = desired;
  } else {
    const { data: cur } = await supabase.from("protocols").select("visibility").eq("id", protocolId).maybeSingle();
    target = (cur?.visibility as Visibility) ?? "medical_only";
  }
  await supabase.from("protocols").update({ visibility: target }).eq("id", protocolId);
  return target;
}

// ── Protocolo (kit) ──
export interface ProtocolMetaInput {
  name: string;
  slug: string;
  clinicalDescription: string;
  pageContent: string;
  visibility: Visibility;
  status: ContentStatus;
}

/** Cria um protocolo vazio (itens/preço definidos no detalhe). Fail-closed. */
export async function createProtocol(input: {
  name: string;
  slug: string;
  clinicalDescription: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .insert({
      name: input.name.trim(),
      slug: input.slug.trim(),
      clinical_description: input.clinicalDescription.trim() || null,
      price: 0,
      price_source: "sum",
      visibility: "medical_only",
      claim_status: "draft",
      status: "draft",
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  await purgeProtocols();
  return { ok: true, id: data.id };
}

export async function saveProtocolMeta(id: string, input: ProtocolMetaInput): Promise<ActionResult> {
  const supabase = await createClient();

  if (input.status === "published") {
    const { data } = await supabase.from("protocols").select("price").eq("id", id).maybeSingle();
    if (!data || Number(data.price) <= 0) {
      return { ok: false, error: "Defina um preço antes de publicar o protocolo." };
    }
  }

  const { error } = await supabase
    .from("protocols")
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      clinical_description: input.clinicalDescription.trim() || null,
      page_content: input.pageContent.trim() ? { body: input.pageContent.trim() } : {},
      status: input.status,
    })
    .eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };

  // Aplica o piso de visibilidade sobre a escolha do operador.
  await enforceVisibilityFloor(supabase, id, input.visibility);

  revalidatePath("/protocols");
  revalidatePath(`/protocols/${id}`);
  await purgeProtocols();
  return { ok: true, id };
}

export async function deleteProtocol(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("protocols").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  await purgeProtocols();
  return { ok: true };
}

// ── Itens do kit (protocol_items) ── (nunca recalcula preço — §6)
export async function addProtocolItem(protocolId: string, itemId: string, quantity: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("protocol_items")
    .select("id", { count: "exact", head: true })
    .eq("protocol_id", protocolId);
  const { error } = await supabase.from("protocol_items").insert({
    protocol_id: protocolId,
    item_id: itemId,
    quantity: Math.max(1, quantity),
    order: count ?? 0,
  });
  if (error) return { ok: false, error: friendlyError(error.message) };
  await enforceVisibilityFloor(supabase, protocolId);
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

export async function updateMemberQuantity(memberId: string, protocolId: string, quantity: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("protocol_items")
    .update({ quantity: Math.max(1, quantity) })
    .eq("id", memberId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

export async function removeProtocolItem(memberId: string, protocolId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("protocol_items").delete().eq("id", memberId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

// ── Preço (§6): recalcula só quando origem = sum; manual nunca é tocado ──
export async function recalcPrice(protocolId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.from("protocols").select("price_source").eq("id", protocolId).maybeSingle();
  if (data?.price_source !== "sum") {
    return { ok: false, error: "Preço manual não recalcula — alguém o definiu de propósito." };
  }
  const sum = await currentSum(supabase, protocolId);
  const { error } = await supabase.from("protocols").update({ price: sum, price_source: "sum" }).eq("id", protocolId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

export async function setPrice(protocolId: string, price: number): Promise<ActionResult> {
  const supabase = await createClient();
  if (price < 0) return { ok: false, error: "Preço inválido." };
  const { error } = await supabase.from("protocols").update({ price, price_source: "manual" }).eq("id", protocolId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

// ── Claims (§8) ──
export async function saveClaims(
  protocolId: string,
  input: { claimInternal: string; claimPublic: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: cur } = await supabase.from("protocols").select("claim_public, claim_status").eq("id", protocolId).maybeSingle();
  const publicChanged = (cur?.claim_public ?? "") !== input.claimPublic.trim();
  const row: any = {
    claim_internal: input.claimInternal.trim() || null,
    claim_public: input.claimPublic.trim() || null,
  };
  // Editar o texto público derruba a aprovação (§8).
  if (publicChanged && cur?.claim_status === "approved") {
    row.claim_status = "draft";
    row.claim_reviewed_at = null;
    row.claim_reviewed_by = null;
  }
  const { error } = await supabase.from("protocols").update(row).eq("id", protocolId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

export async function setClaimStatus(protocolId: string, status: ClaimStatus): Promise<ActionResult> {
  const supabase = await createClient();
  const row: any = { claim_status: status };
  if (status === "approved") {
    const { data: auth } = await supabase.auth.getUser();
    row.claim_reviewed_at = new Date().toISOString();
    row.claim_reviewed_by = auth?.user?.id ?? null;
  }
  const { error } = await supabase.from("protocols").update(row).eq("id", protocolId);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath(`/protocols/${protocolId}`);
  await purgeProtocols();
  return { ok: true };
}

// ── Publish ──
export async function setProtocolStatus(id: string, status: ContentStatus): Promise<ActionResult> {
  const supabase = await createClient();
  if (status === "published") {
    const { data } = await supabase.from("protocols").select("price").eq("id", id).maybeSingle();
    if (!data || Number(data.price) <= 0) {
      return { ok: false, error: "Defina um preço antes de publicar o protocolo." };
    }
  }
  const { error } = await supabase.from("protocols").update({ status }).eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/protocols");
  revalidatePath(`/protocols/${id}`);
  await purgeProtocols();
  return { ok: true };
}
