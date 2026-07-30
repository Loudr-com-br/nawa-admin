import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { bandFromScore, buildRecommendation, type Band, type Recommendation } from "./recommend";
//
// Avaliação da anamnese (spec §7): a lógica vive no backoffice.
// O front envia as respostas; aqui computamos o score (a partir do risk_weight
// e do conteúdo da resposta) e resolvemos a recomendação. O risk_weight NUNCA
// sai para o front — só o resultado.

export interface AnamnesisAnswer {
  questionId: string;
  value: unknown; // boolean | number | string | string[]
}

export interface EvaluationResult {
  formId: string;
  score: number; // 0..100
  band: Band;
  recommendation: Recommendation;
}

/** Quanto uma resposta "conta" para o risco (0..1). Heurística simples/placeholder. */
function factor(type: string, value: unknown, optionsCount: number): number {
  switch (type) {
    case "boolean":
      return value === true ? 1 : 0;
    case "scale": {
      const n = Number(value);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n / 10)) : 0;
    }
    case "multiple_choice": {
      const arr = Array.isArray(value) ? value : [];
      return optionsCount > 0 ? Math.min(1, arr.length / optionsCount) : arr.length ? 1 : 0;
    }
    case "single_choice":
      return value != null && value !== "" ? 1 : 0;
    default: // text / number → presença
      return value != null && String(value).trim() !== "" ? 1 : 0;
  }
}

export async function evaluateAnamnesis(
  formSlug: string,
  answers: AnamnesisAnswer[]
): Promise<EvaluationResult | null> {
  const sb: any = createAdminClient();

  const { data: form } = await sb
    .from("anamnesis_forms")
    .select("id, slug, status, anamnesis_questions(id, type, risk_weight, options)")
    .eq("slug", formSlug)
    .eq("status", "published")
    .maybeSingle();
  if (!form) return null;

  const questions: any[] = form.anamnesis_questions ?? [];
  const answerMap = new Map(answers.map((a) => [a.questionId, a.value]));

  let total = 0;
  let max = 0;
  for (const q of questions) {
    const w = Number(q.risk_weight) || 0;
    max += w;
    if (answerMap.has(q.id)) {
      const optCount = Array.isArray(q.options) ? q.options.length : 0;
      total += w * factor(q.type, answerMap.get(q.id), optCount);
    }
  }

  const score = max > 0 ? Math.round((total / max) * 100) : 0;
  const band = bandFromScore(score);
  const recommendation = await buildRecommendation(sb, band);

  return { formId: form.id, score, band, recommendation };
}
