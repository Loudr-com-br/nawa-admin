import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { DashOrder, DashboardData } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();

  const { data: orderRows, error } = await supabase
    .from("orders")
    .select("total, status, payment_status, created_at, order_items(name, unit_price, quantity, is_glp1)")
    .order("created_at", { ascending: true });
  if (error) throw new Error(`getDashboardData: ${error.message}`);

  const orders: DashOrder[] = (orderRows ?? []).map((o: any) => ({
    total: Number(o.total),
    status: o.status,
    paymentStatus: o.payment_status,
    createdAt: o.created_at,
    items: (o.order_items ?? []).map((i: any) => ({
      name: i.name,
      unitPrice: Number(i.unit_price),
      quantity: i.quantity,
      isGlp1: i.is_glp1,
    })),
  }));

  const [{ count: activeSubscriptions }, { count: patientCount }] = await Promise.all([
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("patients").select("id", { count: "exact", head: true }),
  ]);

  return {
    orders,
    activeSubscriptions: activeSubscriptions ?? 0,
    patientCount: patientCount ?? 0,
  };
}
