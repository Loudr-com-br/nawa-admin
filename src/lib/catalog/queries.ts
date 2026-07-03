import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Plan, CommercialProduct, RefOption } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listPlans(): Promise<Plan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("plans")
    .select("id, journey_id, slug, name, base_price, billing_interval, inclusions, status, created_at, journey:journeys(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listPlans: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    journeyId: r.journey_id,
    journeyName: r.journey?.name ?? "—",
    slug: r.slug,
    name: r.name,
    basePrice: Number(r.base_price),
    billingInterval: r.billing_interval,
    inclusions: Array.isArray(r.inclusions) ? r.inclusions : [],
    status: r.status,
    createdAt: r.created_at,
  }));
}

export async function listProducts(): Promise<CommercialProduct[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commercial_products")
    .select("id, ref_type, ref_id, name, price, is_addon, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProducts: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    refType: r.ref_type,
    refId: r.ref_id,
    name: r.name,
    price: Number(r.price),
    isAddon: r.is_addon,
    status: r.status,
    createdAt: r.created_at,
  }));
}

/** Jornadas para o select do formulário de plano. */
export async function listJourneyOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("journeys").select("id, name").order("name");
  if (error) throw new Error(`listJourneyOptions: ${error.message}`);
  return (data ?? []).map((r: any) => ({ id: r.id, name: r.name }));
}

/** Planos e fórmulas como opções de referência do produto comercial. */
export async function listRefOptions(): Promise<RefOption[]> {
  const supabase = await createClient();
  const [{ data: plans }, { data: formulas }] = await Promise.all([
    supabase.from("plans").select("id, name").order("name"),
    supabase.from("formulas").select("id, name").order("name"),
  ]);
  return [
    ...(plans ?? []).map((p: any) => ({ id: p.id, label: `Plano · ${p.name}`, refType: "plan" as const })),
    ...(formulas ?? []).map((f: any) => ({ id: f.id, label: `Fórmula · ${f.name}`, refType: "formula" as const })),
  ];
}
