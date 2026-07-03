import "server-only";
import { createClient } from "@/lib/supabase/server";
import { listSubscriptionsByPatient } from "@/lib/subscriptions/queries";
import type { Patient, PatientDetail, PatientOrder } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function listPatients(): Promise<Patient[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("patients")
    .select("id, name, email, phone, consent_status, created_at")
    .order("name");

  if (error) throw new Error(`listPatients: ${error.message}`);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    consentStatus: r.consent_status,
    createdAt: r.created_at,
  }));
}

export async function getPatientById(id: string): Promise<PatientDetail | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("patients")
    .select("id, name, email, phone, consent_status, clinical_profile, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getPatientById: ${error.message}`);
  if (!data) return null;

  const { data: orderRows } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .eq("patient_id", id)
    .order("created_at", { ascending: false });

  const orders: PatientOrder[] = (orderRows ?? []).map((o: any) => ({
    id: o.id,
    number: `#NAWA-${String(o.id).slice(0, 4).toUpperCase()}`,
    status: o.status,
    total: Number(o.total),
    createdAt: o.created_at,
  }));

  const subscriptions = await listSubscriptionsByPatient(id);

  const d = data as any;
  return {
    id: d.id,
    name: d.name,
    email: d.email,
    phone: d.phone ?? "",
    consentStatus: d.consent_status,
    createdAt: d.created_at,
    clinicalProfile: d.clinical_profile ?? {},
    subscriptions,
    orders,
  };
}
