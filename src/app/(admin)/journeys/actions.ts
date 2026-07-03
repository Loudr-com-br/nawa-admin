"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import type { ContentStatus } from "@/lib/catalog/types";
import type { JourneyContent } from "@/lib/journeys/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

function friendlyError(message: string): string {
  if (message.includes("duplicate key") || message.includes("_slug_")) {
    return "Já existe uma jornada com esse slug.";
  }
  return message;
}

export interface JourneyInput {
  name: string;
  slug: string;
  content: JourneyContent;
  status: ContentStatus;
}

export async function saveJourney(id: string | null, input: JourneyInput): Promise<ActionResult> {
  const supabase = await createClient();
  const row = {
    name: input.name.trim(),
    slug: input.slug.trim(),
    content: input.content as unknown as Json,
    status: input.status,
  };
  if (id) {
    const { error } = await supabase.from("journeys").update(row).eq("id", id);
    if (error) return { ok: false, error: friendlyError(error.message) };
    revalidatePath("/journeys");
    revalidatePath(`/journeys/${id}`);
    return { ok: true, id };
  }
  const { data, error } = await supabase.from("journeys").insert(row).select("id").single();
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/journeys");
  return { ok: true, id: data.id };
}

export async function deleteJourney(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("journeys").delete().eq("id", id);
  if (error) return { ok: false, error: friendlyError(error.message) };
  revalidatePath("/journeys");
  return { ok: true };
}

/** Vincula um plano à jornada (plans.journey_id). */
export async function attachPlan(journeyId: string, planId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ journey_id: journeyId }).eq("id", planId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/journeys/${journeyId}`);
  return { ok: true };
}

/** Desvincula um plano da jornada. */
export async function detachPlan(journeyId: string, planId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("plans").update({ journey_id: null }).eq("id", planId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/journeys/${journeyId}`);
  return { ok: true };
}
