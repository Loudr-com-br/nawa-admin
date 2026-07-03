"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logAudit } from "@/lib/audit/log";
import type { SubscriptionStatus } from "@/lib/subscriptions/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function updateSub(
  id: string,
  patch: { status?: SubscriptionStatus; plan_id?: string }
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("subscriptions").update(patch).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/subscriptions");
  return { ok: true };
}

export async function setSubscriptionStatus(id: string, status: SubscriptionStatus): Promise<ActionResult> {
  const result = await updateSub(id, { status });
  if (result.ok) await logAudit("subscription.status_change", { entityType: "subscription", entityId: id, changes: { status } });
  return result;
}

/** Upgrade/downgrade: troca o plano da assinatura. */
export async function changeSubscriptionPlan(id: string, planId: string): Promise<ActionResult> {
  const result = await updateSub(id, { plan_id: planId });
  if (result.ok) await logAudit("subscription.plan_change", { entityType: "subscription", entityId: id, changes: { plan_id: planId } });
  return result;
}
