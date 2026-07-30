import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
//
// Leitura do Painel do paciente — SEMPRE escopada ao patientId resolvido da
// sessão (spec §6.3). Devolve o ESTADO cru (enum); a tradução para a linguagem
// do paciente é do frontoffice (spec §8: o backoffice é dono do estado, o
// front é dono da linguagem).

export async function getPatientOrders(patientId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("orders")
    .select("id, status, payment_status, total, created_at, order_items(name, quantity, unit_price)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return {
    orders: (data ?? []).map((o: any) => ({
      number: `#NAWA-${String(o.id).slice(0, 4).toUpperCase()}`,
      status: o.status, // enum cru — o front traduz (§8)
      paymentStatus: o.payment_status,
      total: Number(o.total),
      createdAt: o.created_at,
      items: (o.order_items ?? []).map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
      })),
    })),
  };
}

export async function getPatientSubscriptions(patientId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("subscriptions")
    .select("id, status, current_period_start, current_period_end, plan:plans(name)")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  return {
    subscriptions: (data ?? []).map((s: any) => ({
      status: s.status, // enum cru — o front traduz
      planName: s.plan?.name ?? "—",
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
    })),
  };
}

export async function getPatientProfile(patientId: string) {
  const sb = createAdminClient();
  const { data } = await sb
    .from("patients")
    .select("name, email, phone")
    .eq("id", patientId)
    .single();
  return { name: data?.name ?? "", email: data?.email ?? "", phone: data?.phone ?? "" };
}
