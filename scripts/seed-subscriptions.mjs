/**
 * Semeia assinaturas para os pacientes existentes (§5.4).
 *   node --env-file=.env.local scripts/seed-subscriptions.mjs
 * Idempotente: limpa e recria assinaturas. Não toca em outras tabelas.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Faltam variáveis do Supabase"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const ALL = "00000000-0000-0000-0000-000000000000";
await db.from("subscriptions").delete().neq("id", ALL);

const { data: patients } = await db.from("patients").select("id").order("created_at");
const { data: plans } = await db.from("plans").select("id, name");
if (!patients?.length || !plans?.length) {
  console.error("Rode seed:data antes (faltam pacientes/planos).");
  process.exit(1);
}
const planBy = Object.fromEntries(plans.map((p) => [p.name, p]));

// Maioria ativa; alguns pausados/inadimplentes/cancelados.
const statuses = ["active", "active", "active", "active", "paused", "past_due", "active", "canceled"];

const rows = patients.map((pt, i) => {
  const status = statuses[i % statuses.length];
  const plan = i % 2 === 0 ? planBy["Plus"] : planBy["Start"];
  const start = new Date(Date.UTC(2026, 5, 1 + (i % 28), 12, 0));
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return {
    patient_id: pt.id,
    plan_id: plan.id,
    status,
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
    payment_provider_ref: `sub_${(1000 + i).toString(36)}${(i * 7 + 3).toString(36)}`,
  };
});

const { error } = await db.from("subscriptions").insert(rows);
if (error) { console.error(error.message); process.exit(1); }
console.log(`✓ ${rows.length} assinaturas semeadas.`);
