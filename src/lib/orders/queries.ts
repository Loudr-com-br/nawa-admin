import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Order, OrderItem, OrderEvent } from "./types";

/**
 * Acesso a Pedidos no Supabase. Mapeia as linhas normalizadas do banco
 * para o tipo `Order` que a UI consome — a camada de apresentação não muda.
 * RLS garante o escopo por papel; super_admin vê tudo.
 */

const ORDER_SELECT = `
  id, status, total, payment_status, prescription_id, botane_order_ref, created_at,
  patient:patients ( id, name, email, phone ),
  journey:journeys ( name ),
  plan:plans ( name ),
  order_items ( id, ref_type, name, supplier, is_glp1, quantity, unit_price )
`;

const DETAIL_SELECT = `${ORDER_SELECT},
  order_events ( at, label, description )
`;

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapItem(r: any): OrderItem {
  return {
    id: r.id,
    refType: r.ref_type,
    name: r.name,
    supplier: r.supplier ?? undefined,
    isGlp1: r.is_glp1,
    quantity: r.quantity,
    unitPrice: Number(r.unit_price),
  };
}

function mapOrder(r: any): Order {
  const events: OrderEvent[] = (r.order_events ?? [])
    .map((e: any) => ({ at: e.at, label: e.label, description: e.description ?? undefined }))
    .sort((a: OrderEvent, b: OrderEvent) => +new Date(a.at) - +new Date(b.at));

  const planName = r.plan?.name ?? "—";

  return {
    id: r.id,
    number: `#NAWA-${String(r.id).slice(0, 4).toUpperCase()}`,
    patient: {
      id: r.patient?.id ?? "",
      name: r.patient?.name ?? "—",
      email: r.patient?.email ?? "",
      phone: r.patient?.phone ?? "",
    },
    journey: r.journey?.name ?? "—",
    plan: planName,
    status: r.status,
    paymentStatus: r.payment_status,
    paymentMethod: "Cartão · Pagar.me",
    items: (r.order_items ?? []).map(mapItem),
    total: Number(r.total),
    protocolName:
      planName === "Plus" ? "Reset Metabólico Avançado" : "Reset Metabólico Base",
    prescriptionId: r.prescription_id ?? undefined,
    botaneOrderRef: r.botane_order_ref ?? undefined,
    createdAt: r.created_at,
    history: events,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listOrders(): Promise<Order[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listOrders: ${error.message}`);
  return (data ?? []).map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getOrderById: ${error.message}`);
  return data ? mapOrder(data) : null;
}
