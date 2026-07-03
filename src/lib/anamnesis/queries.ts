import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AnamnesisForm, AnamnesisFormDetail, Question } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapQuestion(r: any): Question {
  return {
    id: r.id,
    formId: r.form_id,
    order: r.order,
    type: r.type,
    label: r.label,
    required: r.required,
    riskWeight: Number(r.risk_weight),
    options: Array.isArray(r.options) ? r.options : [],
    conditional: r.conditional_logic ?? {},
  };
}

export async function listForms(): Promise<AnamnesisForm[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anamnesis_forms")
    .select("id, slug, name, status, created_at, anamnesis_questions(count)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listForms: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    status: r.status,
    questionCount: r.anamnesis_questions?.[0]?.count ?? 0,
    createdAt: r.created_at,
  }));
}

export async function getFormById(id: string): Promise<AnamnesisFormDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("anamnesis_forms")
    .select("id, slug, name, status, created_at, anamnesis_questions(id, form_id, order, type, label, required, risk_weight, options, conditional_logic)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getFormById: ${error.message}`);
  if (!data) return null;

  const d = data as any;
  const questions: Question[] = (d.anamnesis_questions ?? [])
    .map(mapQuestion)
    .sort((a: Question, b: Question) => a.order - b.order);

  return {
    id: d.id,
    slug: d.slug,
    name: d.name,
    status: d.status,
    questionCount: questions.length,
    createdAt: d.created_at,
    questions,
  };
}
