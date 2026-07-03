/**
 * Semeia um formulário de anamnese completo (§5.7) para dar estrutura ao módulo.
 *   node --env-file=.env.local scripts/seed-anamnesis.mjs
 * Idempotente: limpa e recria os formulários de anamnese.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Faltam variáveis do Supabase"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const ALL = "00000000-0000-0000-0000-000000000000";
await db.from("anamnesis_questions").delete().neq("id", ALL);
await db.from("anamnesis_forms").delete().neq("id", ALL);

const { data: form, error: fErr } = await db
  .from("anamnesis_forms")
  .insert({ slug: "metabolic-reset", name: "Anamnese — Metabolic Reset", status: "published" })
  .select()
  .single();
if (fErr) { console.error(fErr.message); process.exit(1); }

// Perguntas: type ∈ text|number|boolean|single_choice|multiple_choice|scale
const questions = [
  { type: "number", label: "Qual a sua idade?", required: true, risk_weight: 1, options: [] },
  { type: "number", label: "Peso atual (kg)", required: true, risk_weight: 1, options: [] },
  { type: "number", label: "Altura (cm)", required: true, risk_weight: 0, options: [] },
  { type: "single_choice", label: "Nível de atividade física", required: true, risk_weight: 2, options: ["Sedentário", "Leve", "Moderado", "Intenso"] },
  { type: "boolean", label: "Histórico de diabetes na família?", required: true, risk_weight: 3, options: [] },
  { type: "multiple_choice", label: "Quais sintomas você tem sentido?", required: false, risk_weight: 2, options: ["Fadiga", "Compulsão alimentar", "Dificuldade para perder peso", "Sono ruim", "Ansiedade"] },
  { type: "boolean", label: "Já usou medicação para emagrecer?", required: false, risk_weight: 1, options: [] },
  { type: "single_choice", label: "Se sim, qual medicação?", required: false, risk_weight: 1, options: ["GLP-1", "Anfetamínico", "Outro"], conditionAfter: 6 },
  { type: "scale", label: "De 0 a 10, seu nível de disposição diária", required: false, risk_weight: 1, options: [] },
  { type: "text", label: "Contraindicações ou condições médicas relevantes", required: false, risk_weight: 0, options: [] },
];

const rows = questions.map((q, i) => ({
  form_id: form.id,
  order: i,
  type: q.type,
  label: q.label,
  required: q.required,
  risk_weight: q.risk_weight,
  options: q.options,
  conditional_logic: {},
}));

const { data: inserted, error: qErr } = await db.from("anamnesis_questions").insert(rows).select();
if (qErr) { console.error(qErr.message); process.exit(1); }

// Liga a condicional (pergunta 8 depende da 7 = "true").
const byOrder = Object.fromEntries(inserted.map((r) => [r.order, r]));
const conditional = questions.findIndex((q) => q.conditionAfter !== undefined);
if (conditional >= 0) {
  const dep = byOrder[questions[conditional].conditionAfter];
  await db
    .from("anamnesis_questions")
    .update({ conditional_logic: { dependsOn: dep.id, equals: true } })
    .eq("id", byOrder[conditional].id);
}

console.log(`✓ Anamnese seedada: "${form.name}" com ${inserted.length} perguntas.`);
