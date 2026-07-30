// Seed de teste do Painel do paciente: cria (ou reaproveita) um usuário no
// Supabase Auth e o LINKA a um paciente que já tem pedidos (patients.auth_user_id).
// Uso: node --env-file=.env.local scripts/seed-patient-auth.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, serviceKey, { auth: { persistSession: false } });

const PASSWORD = "nawa1234";

// 1) escolhe um paciente que tenha pedidos
const { data: orderRows } = await sb.from("orders").select("patient_id").limit(500);
const counts = new Map();
for (const o of orderRows ?? []) counts.set(o.patient_id, (counts.get(o.patient_id) ?? 0) + 1);
const [patientId] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
if (!patientId) {
  console.error("Nenhum paciente com pedidos encontrado.");
  process.exit(1);
}
const { data: patient } = await sb.from("patients").select("id, name, email").eq("id", patientId).single();
const email = patient.email;

// 2) cria o usuário no Auth (idempotente)
let userId;
const created = await sb.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
if (created.error) {
  // já existe → encontra pelo email
  const { data: list } = await sb.auth.admin.listUsers({ perPage: 1000 });
  userId = list?.users?.find((u) => u.email === email)?.id;
  if (!userId) {
    console.error("createUser falhou e usuário não encontrado:", created.error.message);
    process.exit(1);
  }
  console.log("usuário já existia — reaproveitando.");
} else {
  userId = created.data.user.id;
}

// 3) linka o paciente ao auth user
const { error: linkErr } = await sb.from("patients").update({ auth_user_id: userId }).eq("id", patientId);
if (linkErr) {
  console.error("falha ao linkar:", linkErr.message);
  process.exit(1);
}

const { count: orders } = await sb.from("orders").select("id", { count: "exact", head: true }).eq("patient_id", patientId);
const { count: subs } = await sb.from("subscriptions").select("id", { count: "exact", head: true }).eq("patient_id", patientId);

console.log("\n✅ Paciente-teste linkado ao Supabase Auth:");
console.log("   paciente:", patient.name, `(${patient.id})`);
console.log("   pedidos:", orders, "| assinaturas:", subs);
console.log("\n   Credenciais de login (front /account):");
console.log("   email:", email);
console.log("   senha:", PASSWORD);
