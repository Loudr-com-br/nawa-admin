"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  return updateSub(id, { status });
}

/** Upgrade/downgrade: troca o plano da assinatura. */
export async function changeSubscriptionPlan(id: string, planId: string): Promise<ActionResult> {
  return updateSub(id, { plan_id: planId });
}
