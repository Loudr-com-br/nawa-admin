import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Protocol, ProtocolDetail, Formula } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapFormula(r: any): Formula {
  return {
    id: r.id,
    protocolId: r.protocol_id,
    name: r.name,
    pharmaceuticalForm: r.pharmaceutical_form,
    dosage: r.dosage ?? "",
    supplier: r.supplier,
    isGlp1: r.is_glp1,
    externalRef: r.external_ref,
    eligibilityNotes:
      typeof r.eligibility_rules?.notes === "string" ? r.eligibility_rules.notes : "",
    createdAt: r.created_at,
  };
}

export async function listProtocols(): Promise<Protocol[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select("id, slug, name, clinical_description, external_ref, status, created_at, formulas(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listProtocols: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    clinicalDescription: r.clinical_description ?? "",
    externalRef: r.external_ref,
    status: r.status,
    formulaCount: r.formulas?.[0]?.count ?? 0,
    createdAt: r.created_at,
  }));
}

export async function getProtocolById(id: string): Promise<ProtocolDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("protocols")
    .select("id, slug, name, clinical_description, external_ref, status, created_at, formulas(id, protocol_id, name, pharmaceutical_form, dosage, supplier, is_glp1, external_ref, eligibility_rules, created_at)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getProtocolById: ${error.message}`);
  if (!data) return null;

  const d = data as any;
  const formulas: Formula[] = (d.formulas ?? [])
    .map(mapFormula)
    .sort((a: Formula, b: Formula) => +new Date(a.createdAt) - +new Date(b.createdAt));

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    clinicalDescription: d.clinical_description ?? "",
    externalRef: d.external_ref,
    status: d.status,
    formulaCount: formulas.length,
    createdAt: d.created_at,
    formulas,
  };
}
