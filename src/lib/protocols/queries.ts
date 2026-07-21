import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Protocol, ProtocolDetail, ProtocolMember } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function sumItems(protocolItems: any[]): { count: number; sum: number } {
  const rows = protocolItems ?? [];
  const sum = rows.reduce(
    (s, pi) => s + Number(pi.item?.price ?? 0) * (pi.quantity ?? 0),
    0
  );
  return { count: rows.length, sum };
}

export async function listProtocols(): Promise<Protocol[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select(
      "id, slug, name, clinical_description, price, price_source, visibility, " +
        "claim_status, status, version, created_at, protocol_items(quantity, item:items(price))"
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProtocols: ${error.message}`);
  return (data ?? []).map((r: any) => {
    const { count, sum } = sumItems(r.protocol_items);
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      clinicalDescription: r.clinical_description ?? "",
      price: Number(r.price),
      priceSource: r.price_source,
      visibility: r.visibility,
      claimStatus: r.claim_status,
      status: r.status,
      version: r.version,
      itemCount: count,
      itemsSum: sum,
      createdAt: r.created_at,
    };
  });
}

function pageContentBody(pageContent: any): string {
  return typeof pageContent?.body === "string" ? pageContent.body : "";
}

export async function getProtocolById(id: string): Promise<ProtocolDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select(
      "id, slug, name, clinical_description, price, price_source, visibility, " +
        "claim_status, claim_internal, claim_public, claim_reviewed_at, page_content, " +
        "status, version, created_at, " +
        "protocol_items(id, item_id, quantity, order, " +
        "item:items(name, price, visibility, item_type, is_glp1, supplier:suppliers(name)))"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getProtocolById: ${error.message}`);
  if (!data) return null;
  const d = data as any;

  const members: ProtocolMember[] = (d.protocol_items ?? [])
    .map((pi: any) => ({
      id: pi.id,
      itemId: pi.item_id,
      quantity: pi.quantity,
      order: pi.order ?? 0,
      name: pi.item?.name ?? "—",
      price: Number(pi.item?.price ?? 0),
      visibility: pi.item?.visibility ?? "public",
      itemType: pi.item?.item_type ?? "manipulado",
      supplierName: pi.item?.supplier?.name ?? "—",
      isGlp1: pi.item?.is_glp1 ?? false,
    }))
    .sort((a: ProtocolMember, b: ProtocolMember) => a.order - b.order);

  const { sum } = sumItems(d.protocol_items);

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    clinicalDescription: d.clinical_description ?? "",
    price: Number(d.price),
    priceSource: d.price_source,
    visibility: d.visibility,
    claimStatus: d.claim_status,
    claimInternal: d.claim_internal ?? "",
    claimPublic: d.claim_public ?? "",
    claimReviewedAt: d.claim_reviewed_at,
    pageContent: pageContentBody(d.page_content),
    status: d.status,
    version: d.version,
    itemCount: members.length,
    itemsSum: sum,
    createdAt: d.created_at,
    members,
  };
}
