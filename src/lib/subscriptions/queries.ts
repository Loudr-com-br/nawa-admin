import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Subscription } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapSub(r: any): Subscription {
  return {
    id: r.id,
    patientId: r.patient_id,
    patientName: r.patient?.name ?? "—",
    patientEmail: r.patient?.email ?? "",
    planId: r.plan_id,
    planName: r.plan?.name ?? "—",
    status: r.status,
    currentPeriodStart: r.current_period_start,
    currentPeriodEnd: r.current_period_end,
    paymentProviderRef: r.payment_provider_ref,
    createdAt: r.created_at,
  };
}

const SELECT = `
  id, patient_id, plan_id, status, current_period_start, current_period_end,
  payment_provider_ref, created_at,
  patient:patients ( name, email ),
  plan:plans ( name )
`;

export async function listSubscriptions(): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(SELECT)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSubscriptions: ${error.message}`);
  return (data ?? []).map(mapSub);
}

/** Assinaturas de um paciente (para a ficha). */
export async function listSubscriptionsByPatient(patientId: string): Promise<Subscription[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select(SELECT)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listSubscriptionsByPatient: ${error.message}`);
  return (data ?? []).map(mapSub);
}

export async function listPlanOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("plans").select("id, name").order("name");
  if (error) throw new Error(`listPlanOptions: ${error.message}`);
  return (data ?? []).map((p: any) => ({ id: p.id, name: p.name }));
}
