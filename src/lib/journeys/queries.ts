import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Journey, JourneyDetail, JourneyPlan, PlanOption, JourneyContent } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapContent(raw: any): JourneyContent {
  const c = raw ?? {};
  return {
    tagline: typeof c.tagline === "string" ? c.tagline : "",
    description: typeof c.description === "string" ? c.description : "",
    highlights: Array.isArray(c.highlights) ? c.highlights : [],
  };
}

export async function listJourneys(): Promise<Journey[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("id, slug, name, status, created_at, plans(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listJourneys: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    status: r.status,
    planCount: r.plans?.[0]?.count ?? 0,
    createdAt: r.created_at,
  }));
}

export async function getJourneyById(id: string): Promise<JourneyDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("journeys")
    .select("id, slug, name, status, content, created_at, plans(id, name, base_price, billing_interval, status)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getJourneyById: ${error.message}`);
  if (!data) return null;

  const d = data as any;
  const plans: JourneyPlan[] = (d.plans ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    basePrice: Number(p.base_price),
    billingInterval: p.billing_interval,
    status: p.status,
  }));

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    status: d.status,
    planCount: plans.length,
    createdAt: d.created_at,
    content: mapContent(d.content),
    plans,
  };
}

/** Todos os planos, para o seletor de vínculo. */
export async function listPlanOptions(): Promise<PlanOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("id, name, journey_id").order("name");
  if (error) throw new Error(`listPlanOptions: ${error.message}`);
  return (data ?? []).map((p: any) => ({ id: p.id, name: p.name, journeyId: p.journey_id }));
}
