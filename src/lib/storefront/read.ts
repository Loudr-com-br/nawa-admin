import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Catálogo publicado: jornadas (com planos publicados) + produtos publicados. */
export async function getPublishedCatalog() {
  const supabase = createAdminClient();

  const { data: journeys } = await supabase
    .from("journeys")
    .select("slug, name, content, plans(slug, name, base_price, billing_interval, inclusions, status)")
    .eq("status", "published");

  const { data: products } = await supabase
    .from("commercial_products")
    .select("name, ref_type, ref_id, price, is_addon")
    .eq("status", "published");

  return {
    journeys: (journeys ?? []).map((j: any) => ({
      slug: j.slug,
      name: j.name,
      content: j.content ?? {},
      plans: (j.plans ?? [])
        .filter((p: any) => p.status === "published")
        .map((p: any) => ({
          slug: p.slug,
          name: p.name,
          basePrice: Number(p.base_price),
          billingInterval: p.billing_interval,
          inclusions: p.inclusions ?? [],
        })),
    })),
    products: (products ?? []).map((p: any) => ({
      name: p.name,
      refType: p.ref_type,
      refId: p.ref_id,
      price: Number(p.price),
      isAddon: p.is_addon,
    })),
  };
}

/** Protocolos publicados com suas fórmulas. */
export async function getPublishedProtocols() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("protocols")
    .select("slug, name, clinical_description, formulas(name, pharmaceutical_form, dosage, supplier, is_glp1)")
    .eq("status", "published");

  return {
    protocols: (data ?? []).map((p: any) => ({
      slug: p.slug,
      name: p.name,
      clinicalDescription: p.clinical_description ?? "",
      formulas: (p.formulas ?? []).map((f: any) => ({
        name: f.name,
        form: f.pharmaceutical_form,
        dosage: f.dosage ?? "",
        supplier: f.supplier,
        isGlp1: f.is_glp1,
      })),
    })),
  };
}

/** Formulários de anamnese publicados com perguntas ordenadas. */
export async function getPublishedAnamnesis() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("anamnesis_forms")
    .select("slug, name, anamnesis_questions(order, type, label, required, options, conditional_logic)")
    .eq("status", "published");

  return {
    forms: (data ?? []).map((f: any) => ({
      slug: f.slug,
      name: f.name,
      questions: (f.anamnesis_questions ?? [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((q: any) => ({
          order: q.order,
          type: q.type,
          label: q.label,
          required: q.required,
          options: q.options ?? [],
          conditional: q.conditional_logic ?? {},
        })),
    })),
  };
}
