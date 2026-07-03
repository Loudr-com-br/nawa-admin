/**
 * Gera muitos pedidos distribuídos nos últimos 60 dias, para dar densidade ao
 * dashboard analítico. Só toca em orders/order_items/order_events — preserva
 * catálogo, protocolos, jornadas, pacientes.
 *   node --env-file=.env.local scripts/seed-orders-bulk.mjs [quantidade]
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Faltam variáveis do Supabase"); process.exit(1); }
const db = createClient(url, key, { auth: { persistSession: false } });

const N = Number(process.argv[2] ?? 180);
const DAYS = 60;
const NOW = new Date("2026-07-03T18:00:00-03:00");

const { data: patients } = await db.from("patients").select("id");
const { data: plans } = await db.from("plans").select("id, name, base_price");
const { data: journeys } = await db.from("journeys").select("id").limit(1);
if (!patients?.length || !plans?.length || !journeys?.length) {
  console.error("Rode seed:data antes."); process.exit(1);
}
const journeyId = journeys[0].id;
const planBy = Object.fromEntries(plans.map((p) => [p.name, p]));

const ALL = "00000000-0000-0000-0000-000000000000";
for (const t of ["order_events", "order_items", "orders"]) {
  await db.from(t).delete().neq("id", ALL);
}

const glp1 = [
  { name: "Semaglutida 0,5 mg (magistral)", supplier: "botane", price: 640 },
  { name: "Semaglutida 1,0 mg (original)", supplier: "partner", price: 820 },
  { name: "Tirzepatida 2,5 mg (magistral)", supplier: "botane", price: 890 },
  { name: "Tirzepatida 5,0 mg (original)", supplier: "partner", price: 1180 },
];
// Distribuição de status realista (maioria entregue/pago; poucos falhos).
const statusPool = [
  ...Array(30).fill("delivered"),
  ...Array(22).fill("shipped"),
  ...Array(20).fill("in_production"),
  ...Array(18).fill("paid"),
  ...Array(10).fill("failed"),
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

const orders = [];
for (let i = 0; i < N; i++) {
  const status = pick(statusPool);
  const isPlus = Math.random() < 0.5;
  const plan = isPlus ? planBy["Plus"] : planBy["Start"];
  // datas com leve tendência de crescimento recente
  const daysAgo = Math.floor(Math.pow(Math.random(), 1.3) * DAYS);
  const created = new Date(NOW.getTime() - daysAgo * 86400000 - Math.floor(Math.random() * 86400000));

  const items = [
    { ref_type: "plan", name: `Plano ${plan.name} — mensal`, supplier: null, is_glp1: false, quantity: 1, unit_price: Number(plan.base_price) },
  ];
  if (isPlus || Math.random() < 0.6) {
    const g = pick(glp1);
    items.push({ ref_type: "formula", name: g.name, supplier: g.supplier, is_glp1: true, quantity: 1, unit_price: g.price });
  }
  if (Math.random() < 0.25) {
    items.push({ ref_type: "formula", name: "Complexo Metabólico B — cápsula", supplier: "botane", is_glp1: false, quantity: 1, unit_price: 145 });
  }
  const total = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  const payment = status === "failed" ? (Math.random() < 0.5 ? "failed" : "pending") : (Math.random() < 0.06 ? "refunded" : "paid");
  const produced = ["in_production", "shipped", "delivered"].includes(status);

  orders.push({
    patient_id: pick(patients).id,
    journey_id: journeyId,
    plan_id: plan.id,
    status,
    total,
    payment_status: payment,
    prescription_id: `rx_${90000 + i}`,
    botane_order_ref: produced ? `BOT-2026-${5000 + i}` : null,
    created_at: created.toISOString(),
    _items: items,
  });
}

const rows = orders.map(({ _items, ...o }) => o);
const inserted = await (async () => {
  const out = [];
  // insere em lotes de 100
  for (let i = 0; i < rows.length; i += 100) {
    const { data, error } = await db.from("orders").insert(rows.slice(i, i + 100)).select("id");
    if (error) { console.error(error.message); process.exit(1); }
    out.push(...data);
  }
  return out;
})();

const allItems = [];
const allEvents = [];
inserted.forEach((o, i) => {
  orders[i]._items.forEach((it) => allItems.push({ order_id: o.id, ...it }));
  const t0 = new Date(rows[i].created_at);
  allEvents.push({ order_id: o.id, at: t0.toISOString(), label: "Pedido criado" });
  if (rows[i].payment_status === "paid") allEvents.push({ order_id: o.id, at: new Date(t0.getTime() + 30000).toISOString(), label: "Pagamento aprovado" });
});

for (let i = 0; i < allItems.length; i += 200) {
  const { error } = await db.from("order_items").insert(allItems.slice(i, i + 200));
  if (error) { console.error(error.message); process.exit(1); }
}
for (let i = 0; i < allEvents.length; i += 200) {
  const { error } = await db.from("order_events").insert(allEvents.slice(i, i + 200));
  if (error) { console.error(error.message); process.exit(1); }
}

console.log(`✓ ${inserted.length} pedidos, ${allItems.length} itens, ${allEvents.length} eventos (60 dias).`);
