import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/lib/orders/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RecentOrder {
  id: string;
  number: string;
  patientName: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
}

export interface DashboardMetrics {
  orderCount: number;
  activeSubscriptions: number;
  mrr: number;
  pastDue: number;
  patientCount: number;
  recentOrders: RecentOrder[];
  botaneAlerts: number;
}

async function count(supabase: any, table: string, filter?: (q: any) => any): Promise<number> {
  let q = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) q = filter(q);
  const { count } = await q;
  return count ?? 0;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = await createClient();

  const [orderCount, pastDue, patientCount, botaneAlerts] = await Promise.all([
    count(supabase, "orders"),
    count(supabase, "subscriptions", (q: any) => q.eq("status", "past_due")),
    count(supabase, "patients"),
    count(supabase, "botane_sync_log", (q: any) => q.neq("status", "success")),
  ]);

  // Assinaturas ativas + MRR (soma do preço-base dos planos ativos).
  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("id, plan:plans(base_price)")
    .eq("status", "active");
  const activeSubscriptions = activeSubs?.length ?? 0;
  const mrr = (activeSubs ?? []).reduce(
    (sum: number, s: any) => sum + Number(s.plan?.base_price ?? 0),
    0
  );

  // Pedidos recentes.
  const { data: recent } = await supabase
    .from("orders")
    .select("id, status, total, created_at, patient:patients(name)")
    .order("created_at", { ascending: false })
    .limit(6);

  const recentOrders: RecentOrder[] = (recent ?? []).map((o: any) => ({
    id: o.id,
    number: `#NAWA-${String(o.id).slice(0, 4).toUpperCase()}`,
    patientName: o.patient?.name ?? "—",
    status: o.status,
    total: Number(o.total),
    createdAt: o.created_at,
  }));

  return { orderCount, activeSubscriptions, mrr, pastDue, patientCount, recentOrders, botaneAlerts };
}
