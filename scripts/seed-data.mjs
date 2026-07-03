/**
 * Popula o banco com dados de exemplo (jornada, planos, protocolos, fórmulas,
 * pacientes, pedidos + itens + eventos) para dar vida às telas.
 *
 *   node --env-file=.env.local scripts/seed-data.mjs
 *
 * Idempotente: limpa as tabelas de demo e recria. Usa a SERVICE_ROLE_KEY.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam variáveis do Supabase no .env.local");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const ALL = "00000000-0000-0000-0000-000000000000";
async function wipe(table) {
  const { error } = await db.from(table).delete().neq("id", ALL);
  if (error) throw new Error(`wipe ${table}: ${error.message}`);
}
async function insert(table, rows) {
  const { data, error } = await db.from(table).insert(rows).select();
  if (error) throw new Error(`insert ${table}: ${error.message}`);
  return data;
}

// Ordem segura por FKs.
for (const t of [
  "order_events", "order_items", "orders", "subscriptions",
  "formulas", "protocols", "commercial_products", "plans", "journeys", "patients",
]) {
  await wipe(t);
}

// ── Catálogo comercial ──
const [journey] = await insert("journeys", [
  { slug: "metabolic-reset", name: "Metabolic Reset", status: "published", content: {} },
]);

const plans = await insert("plans", [
  { journey_id: journey.id, slug: "start", name: "Start", base_price: 390, billing_interval: "monthly", status: "published", inclusions: ["Acompanhamento médico", "1 fórmula base"] },
  { journey_id: journey.id, slug: "plus", name: "Plus", base_price: 590, billing_interval: "monthly", status: "published", inclusions: ["Acompanhamento médico", "Fórmulas avançadas", "GLP-1 incluso"] },
]);
const planBy = Object.fromEntries(plans.map((p) => [p.name, p]));

// ── Catálogo clínico ──
const protocols = await insert("protocols", [
  { slug: "reset-base", name: "Reset Metabólico Base", clinical_description: "Protocolo inicial.", status: "published", external_ref: "BOT-P-001" },
  { slug: "reset-avancado", name: "Reset Metabólico Avançado", clinical_description: "Protocolo com GLP-1.", status: "published", external_ref: "BOT-P-002" },
]);
const protoBy = Object.fromEntries(protocols.map((p) => [p.name, p]));

await insert("formulas", [
  { protocol_id: protoBy["Reset Metabólico Base"].id, name: "Complexo Metabólico B", pharmaceutical_form: "capsule", dosage: "500mg", supplier: "botane", is_glp1: false, external_ref: "BOT-F-010" },
  { protocol_id: protoBy["Reset Metabólico Avançado"].id, name: "Semaglutida (magistral)", pharmaceutical_form: "sublingual", dosage: "1,0mg", supplier: "botane", is_glp1: true, external_ref: "BOT-F-020" },
  { protocol_id: protoBy["Reset Metabólico Avançado"].id, name: "Tirzepatida (original)", pharmaceutical_form: "other", dosage: "5,0mg", supplier: "partner", is_glp1: true, external_ref: "PART-F-030" },
]);

// ── Pacientes ──
const names = [
  "Marina Alves", "Rafael Monteiro", "Camila Duarte", "Bruno Carvalho", "Helena Prado",
  "Otávio Ramires", "Letícia Nunes", "Diego Fontes", "Isabela Rocha", "Thiago Barbosa",
  "Fernanda Lima", "Gustavo Pereira", "Patrícia Souza", "André Martins", "Juliana Castro", "Ricardo Almeida",
];
const patientRows = names.map((name, i) => {
  const slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  return {
    name,
    email: `${slug}@email.com`,
    phone: `+55 11 9${String(80000000 + i * 137).slice(0, 8)}`,
    consent_status: "granted",
    clinical_profile: {},
  };
});
const patients = await insert("patients", patientRows);

// ── Pedidos ──
const glp1Options = [
  { name: "Semaglutida 0,5 mg (magistral)", supplier: "botane", price: 640 },
  { name: "Semaglutida 1,0 mg (original)", supplier: "partner", price: 820 },
  { name: "Tirzepatida 2,5 mg (magistral)", supplier: "botane", price: 890 },
  { name: "Tirzepatida 5,0 mg (original)", supplier: "partner", price: 1180 },
];
const statuses = ["paid", "in_production", "shipped", "delivered", "failed"];

function paymentFor(status, i) {
  if (status === "failed") return "failed";
  if (status === "delivered" && i % 7 === 0) return "refunded";
  if (status === "paid" && i % 8 === 0) return "pending";
  return "paid";
}

const orders = [];
const allItems = [];
const allEvents = [];

patients.forEach((pt, i) => {
  const status = statuses[i % statuses.length];
  const payment = paymentFor(status, i);
  const isPlus = i % 2 === 0;
  const plan = isPlus ? planBy["Plus"] : planBy["Start"];
  const proto = isPlus ? protoBy["Reset Metabólico Avançado"] : protoBy["Reset Metabólico Base"];
  const day = 2 + i; // datas espalhadas em jun/2026
  const createdAt = new Date(Date.UTC(2026, 5, Math.max(1, 28 - i), 12, 0)).toISOString();

  const items = [
    { ref_type: "plan", name: `Plano ${plan.name} — mensal`, quantity: 1, unit_price: Number(plan.base_price) },
  ];
  if (isPlus || i % 3 !== 0) {
    const g = glp1Options[i % glp1Options.length];
    items.push({ ref_type: "formula", name: g.name, supplier: g.supplier, is_glp1: true, quantity: 1, unit_price: g.price });
  }
  if (i % 4 === 0) {
    items.push({ ref_type: "formula", name: "Complexo Metabólico B — cápsula", supplier: "botane", quantity: 1, unit_price: 145 });
  }
  const total = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const produced = ["in_production", "shipped", "delivered"].includes(status);

  orders.push({
    _idx: i,
    patient_id: pt.id,
    journey_id: journey.id,
    plan_id: plan.id,
    status,
    total,
    payment_status: payment,
    prescription_id: `rx_${88000 + i}`,
    botane_order_ref: produced ? `BOT-2026-${4400 + i}` : null,
    created_at: createdAt,
    _items: items,
    _proto: proto.name,
  });
});

// Insere pedidos e captura ids.
const orderRows = orders.map(({ _idx, _items, _proto, ...o }) => o);
const insertedOrders = await insert("orders", orderRows);

// Itens e eventos vinculados.
insertedOrders.forEach((o, i) => {
  const src = orders[i];
  src._items.forEach((it) =>
    allItems.push({ order_id: o.id, supplier: null, is_glp1: false, ...it })
  );

  const t0 = new Date(o.created_at);
  allEvents.push({ order_id: o.id, at: t0.toISOString(), label: "Pedido criado", description: "Checkout concluído." });
  if (o.payment_status === "paid") {
    allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 30000).toISOString(), label: "Pagamento aprovado", description: "Tokenização Pagar.me." });
  } else if (o.payment_status === "failed") {
    allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 30000).toISOString(), label: "Pagamento recusado", description: "Emissor negou a transação." });
  }
  if (["in_production", "shipped", "delivered"].includes(o.status)) {
    allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 86400000).toISOString(), label: "Em produção", description: "Enviado à Botane." });
  }
  if (["shipped", "delivered"].includes(o.status)) {
    allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 3 * 86400000).toISOString(), label: "Enviado" });
  }
  if (o.status === "delivered") {
    allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 5 * 86400000).toISOString(), label: "Entregue", description: "Recebido pelo paciente." });
  }
});

await insert("order_items", allItems);
await insert("order_events", allEvents);

console.log(
  `✓ Seed concluído: 1 jornada, ${plans.length} planos, ${protocols.length} protocolos, ` +
  `${patients.length} pacientes, ${insertedOrders.length} pedidos, ${allItems.length} itens, ${allEvents.length} eventos.`
);
