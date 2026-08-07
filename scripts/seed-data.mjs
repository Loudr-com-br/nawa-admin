/**
 * Popula o banco com dados de exemplo do Catálogo v2 (itens/SKUs, protocolos/kits,
 * coleções, planos, pacientes, pedidos + itens + eventos) para dar vida às telas.
 *
 *   node --env-file=.env.local scripts/seed-data.mjs
 *
 * Idempotente: limpa as tabelas de demo e recria. Usa a SERVICE_ROLE_KEY.
 *
 * v2 (2026-07): "fórmula" virou "item" (SKU pronto com preço próprio), o protocolo
 * virou kit (N↔N com itens via protocol_items, preço próprio) e jornada virou coleção.
 * `suppliers` é semeado pela migration (botane/partner-glp1/nawa) — aqui só referenciamos.
 * Nota: pedidos ainda usam `order_items` (modelo vivo); a migração para `order_lines`
 * entra na Fase 5.
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

// Ordem segura por FKs (filhos antes dos pais). `suppliers` NÃO é limpo —
// é dado de referência semeado pela migration.
for (const t of [
  "order_events", "order_items", "order_lines", "orders",
  "subscription_lines", "subscriptions",
  "collection_members", "collections",
  "protocol_versions", "protocol_items",
  "items", "protocols", "plans", "patients",
]) {
  await wipe(t);
}

// ── Fornecedores (semeados pela migration; aqui só resolvemos os ids) ──
const { data: suppliers, error: supErr } = await db
  .from("suppliers").select("id, slug");
if (supErr) throw new Error(`suppliers: ${supErr.message}`);
if (!suppliers?.length) {
  console.error("Nenhum fornecedor encontrado — a migration catalog_v2 foi aplicada?");
  process.exit(1);
}
const supplierBy = Object.fromEntries(suppliers.map((s) => [s.slug, s.id]));
const BOTANE = supplierBy["botane"];
const PARTNER = supplierBy["partner-glp1"];
const NAWA = supplierBy["nawa"];

// ── Planos (mantidos; reorganizados p/ checkout numa fase futura — sem journey_id) ──
const plans = await insert("plans", [
  { slug: "start", name: "Start", base_price: 390, billing_interval: "monthly", status: "published", inclusions: ["Acompanhamento médico", "1 item base"] },
  { slug: "plus", name: "Plus", base_price: 590, billing_interval: "monthly", status: "published", inclusions: ["Acompanhamento médico", "Itens avançados", "GLP-1 incluso"] },
]);
const planBy = Object.fromEntries(plans.map((p) => [p.name, p]));

// ── Itens / SKUs (o catálogo único) ──
// price é sempre propriedade NAWA; cost vem do fornecedor (nulo quando não expõe).
// Medicamento força visibility=medical_only (regra dura §7).
const itemRows = [
  {
    slug: "complexo-metabolico-b", name: "Complexo Metabólico B", supplier_id: BOTANE,
    external_ref: "BOT-F-010", item_type: "manipulado", pharmaceutical_form: "capsula",
    description: "Complexo vitamínico de suporte metabólico.",
    composition: { raw: "500mg — complexo B, cromo, ácido alfa-lipoico" },
    cautions: [{ type: "info", description: "Tomar após a refeição." }],
    cost: 60, price: 145, is_glp1: false, sells_standalone: true,
    visibility: "public", status: "published", synced_at: new Date().toISOString(),
  },
  {
    slug: "omega-3", name: "Ômega-3 EPA/DHA", supplier_id: BOTANE,
    external_ref: "BOT-F-011", item_type: "suplemento", pharmaceutical_form: "capsula",
    description: "Ácidos graxos essenciais.",
    composition: { raw: "1000mg — 660mg EPA / 440mg DHA" },
    cautions: [], cost: 40, price: 90, is_glp1: false, sells_standalone: true,
    visibility: "public", status: "published",
  },
  {
    slug: "semaglutida-magistral", name: "Semaglutida (magistral)", supplier_id: BOTANE,
    external_ref: "BOT-F-020", item_type: "medicamento", pharmaceutical_form: "sublingual",
    description: "Análogo de GLP-1, uso sob prescrição.",
    composition: { raw: "1,0mg" },
    cautions: [{ type: "warning", description: "Exige prescrição e acompanhamento médico." }],
    cost: 300, price: 640, is_glp1: true, sells_standalone: true,
    visibility: "medical_only", status: "published", synced_at: new Date().toISOString(),
  },
  {
    slug: "tirzepatida-original", name: "Tirzepatida (original)", supplier_id: PARTNER,
    external_ref: "PART-F-030", item_type: "medicamento", pharmaceutical_form: "outro",
    description: "Agonista duplo GIP/GLP-1, produto acabado.",
    composition: { raw: "5,0mg — caneta injetável" },
    cautions: [{ type: "warning", description: "Exige prescrição e acompanhamento médico." }],
    cost: 700, price: 1180, is_glp1: true, sells_standalone: true,
    visibility: "medical_only", status: "published", synced_at: new Date().toISOString(),
  },
  {
    slug: "acompanhamento-nawa", name: "Acompanhamento NAWA", supplier_id: NAWA,
    external_ref: null, item_type: "servico", pharmaceutical_form: "na",
    description: "Acompanhamento profissional mensal (serviço interno NAWA).",
    composition: {}, cautions: [], cost: null, price: 390, is_glp1: false,
    sells_standalone: true, visibility: "public", status: "published",
  },
];
const items = await insert("items", itemRows);
const itemBy = Object.fromEntries(items.map((i) => [i.slug, i]));

// ── Protocolos / Kits (curadoria NAWA) ──
// Composição do kit → soma dos itens define o preço (price_source='sum').
// Visibilidade do kit = a mais restrita entre seus itens.
const kits = [
  {
    slug: "reset-base", name: "Reset Metabólico Base",
    clinical_description: "Protocolo inicial de suporte metabólico, sem GLP-1.",
    members: [
      { slug: "complexo-metabolico-b", quantity: 1 },
      { slug: "omega-3", quantity: 1 },
      { slug: "acompanhamento-nawa", quantity: 1 },
    ],
    claim_internal: "Base metabólica para iniciar a jornada de emagrecimento, sem GLP-1.",
    claim_public: "Suporte nutricional e metabólico para iniciar sua jornada com acompanhamento profissional.",
    claim_status: "approved",
  },
  {
    slug: "reset-avancado", name: "Reset Metabólico Avançado",
    clinical_description: "Protocolo com análogo de GLP-1 e acompanhamento.",
    members: [
      { slug: "complexo-metabolico-b", quantity: 1 },
      { slug: "semaglutida-magistral", quantity: 1 },
      { slug: "acompanhamento-nawa", quantity: 1 },
    ],
    claim_internal: "Base metabólica com GLP-1 para ajuste metabólico acompanhado.",
    claim_public: "Suporte metabólico avançado com acompanhamento profissional.",
    claim_status: "pending_review",
  },
];

const protocolRows = kits.map((k) => {
  const price = k.members.reduce(
    (s, m) => s + Number(itemBy[m.slug].price) * m.quantity, 0);
  const visibility = k.members.some((m) => itemBy[m.slug].visibility === "medical_only")
    ? "medical_only" : "public";
  return {
    slug: k.slug, name: k.name, clinical_description: k.clinical_description,
    page_content: {}, claim_internal: k.claim_internal, claim_public: k.claim_public,
    claim_status: k.claim_status,
    claim_reviewed_at: k.claim_status === "approved" ? new Date().toISOString() : null,
    price, price_source: "sum", visibility, status: "published", version: 1,
  };
});
const protocols = await insert("protocols", protocolRows);
const protoBy = Object.fromEntries(protocols.map((p) => [p.slug, p]));

// ── protocol_items (N↔N item↔kit) ──
const protocolItemRows = kits.flatMap((k) =>
  k.members.map((m, order) => ({
    protocol_id: protoBy[k.slug].id,
    item_id: itemBy[m.slug].id,
    quantity: m.quantity,
    order,
  }))
);
await insert("protocol_items", protocolItemRows);

// ── Coleções (absorvem jornada + atributos) ──
const [reset] = await insert("collections", [
  { slug: "metabolic-reset", name: "Metabolic Reset",
    description: "Coleção de topo para a jornada de emagrecimento metabólico.",
    parent_id: null, visibility: "public", status: "published", order: 0 },
]);
await insert("collection_members", [
  { collection_id: reset.id, ref_type: "protocol", ref_id: protoBy["reset-base"].id, order: 0 },
  { collection_id: reset.id, ref_type: "protocol", ref_id: protoBy["reset-avancado"].id, order: 1 },
]);

// ── Pacientes ──
// Âncoras nomeados (estáveis entre execuções — o painel de teste linka o de
// mais pedidos via seed-patient-auth). Depois deles, geramos uma base maior
// combinando pools de nomes, para dar densidade às listas/dashboard do admin.
const anchorNames = [
  "Marina Alves", "Rafael Monteiro", "Camila Duarte", "Bruno Carvalho", "Helena Prado",
  "Otávio Ramires", "Letícia Nunes", "Diego Fontes", "Isabela Rocha", "Thiago Barbosa",
  "Fernanda Lima", "Gustavo Pereira", "Patrícia Souza", "André Martins", "Juliana Castro", "Ricardo Almeida",
];
const firstNames = [
  "Ana", "Pedro", "Beatriz", "Lucas", "Mariana", "Felipe", "Larissa", "Rodrigo",
  "Carolina", "Vinícius", "Aline", "Mateus", "Sofia", "Daniel", "Renata", "Eduardo",
  "Bianca", "Leonardo", "Natália", "Fábio", "Priscila", "Henrique", "Tatiane", "Marcelo",
  "Vanessa", "Caio", "Débora", "Rafaela", "Gabriel", "Amanda", "Rogério", "Simone",
];
const surnames = [
  "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Costa", "Gomes",
  "Ribeiro", "Carvalho", "Teixeira", "Moreira", "Cardoso", "Nascimento", "Araújo",
  "Mendes", "Barros", "Freitas", "Pinto", "Cavalcanti", "Dias", "Correia", "Azevedo", "Rocha",
];
const EXTRA_PATIENTS = 64;
const generatedNames = Array.from({ length: EXTRA_PATIENTS }, (_, i) => {
  const fn = firstNames[(i * 3) % firstNames.length];
  const sn1 = surnames[(i * 7 + 1) % surnames.length];
  const sn2 = surnames[(i * 13 + 5) % surnames.length];
  return sn1 === sn2 ? `${fn} ${sn1}` : `${fn} ${sn1} ${sn2}`;
});
const names = [...anchorNames, ...generatedNames];

// Cadastros espalhados entre 1/abr e 20/jul de 2026 (determinístico por índice).
const SIGNUP_START = Date.UTC(2026, 3, 1, 9, 0);
const SIGNUP_SPAN = Date.UTC(2026, 6, 20, 18, 0) - SIGNUP_START;
const usedEmails = new Set();
const patientRows = names.map((name, i) => {
  let slug = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, ".");
  if (usedEmails.has(slug)) slug = `${slug}.${i}`; // garante email único
  usedEmails.add(slug);
  const createdAt = new Date(
    SIGNUP_START + Math.floor((i / Math.max(1, names.length - 1)) * SIGNUP_SPAN) + (i * 53 % 11) * 3600000
  ).toISOString();
  // Maioria com consentimento; alguns pendentes/revogados para exercitar filtros.
  const consent_status = i % 11 === 0 ? "pending" : i % 29 === 0 ? "revoked" : "granted";
  // Perfil clínico leve em parte da base (o suficiente p/ telas, não é dado real).
  const clinical_profile = i % 3 === 0
    ? { age: 28 + (i % 30), weight_kg: 62 + (i % 45), height_cm: 158 + (i % 28), goal: ["emagrecimento", "energia", "metabolismo"][i % 3] }
    : {};
  return {
    name,
    email: `${slug}@email.com`,
    phone: `+55 11 9${String(80000000 + i * 137).slice(0, 8)}`,
    consent_status,
    clinical_profile,
    created_at: createdAt,
  };
});
const patients = await insert("patients", patientRows);

// ── Pedidos ── (order_items segue vivo; ref_type 'plan'/'formula' são enum, não tabela)
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
  // pedido feito alguns dias após o cadastro do paciente
  const createdAt = new Date(new Date(pt.created_at).getTime() + (2 + (i % 6)) * 86400000).toISOString();

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
    plan_id: plan.id,
    status,
    total,
    payment_status: payment,
    prescription_id: `rx_${88000 + i}`,
    botane_order_ref: produced ? `BOT-2026-${4400 + i}` : null,
    created_at: createdAt,
    _items: items,
  });
});

// Insere pedidos e captura ids.
const orderRows = orders.map(({ _idx, _items, ...o }) => o);
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
  `✓ Seed v2 concluído: ${suppliers.length} fornecedores, ${plans.length} planos, ` +
  `${items.length} itens, ${protocols.length} protocolos, ${protocolItemRows.length} vínculos, ` +
  `1 coleção, ${patients.length} pacientes, ${insertedOrders.length} pedidos, ` +
  `${allItems.length} itens de pedido, ${allEvents.length} eventos.`
);
