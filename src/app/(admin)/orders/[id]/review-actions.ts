"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decideClinicalReview, type ClinicalDecision } from "@/lib/orders/clinical-review";

// Decisão da revisão clínica. A autorização é checada AQUI, no servidor: só médico
// e super admin decidem. O operador enxerga a fila mas não assina por ela — a
// responsabilidade clínica tem dono, e é isso que sustenta a posição da NAWA como
// plataforma que agrega em vez de prestar o serviço médico.

const MENSAGENS: Record<string, string> = {
  order_not_found: "Pedido não encontrado.",
  order_not_in_review: "Este pedido não está aguardando revisão clínica.",
  notes_required_for_rejection: "Descreva o motivo da ressalva — é registro clínico.",
  review_insert_failed: "Não foi possível registrar a decisão.",
};

export async function submitClinicalDecision(
  orderId: string,
  decision: ClinicalDecision,
  notes?: string,
): Promise<{ error: string } | { ok: true }> {
  const sb = await createClient();

  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente." };

  // users_internal.id É o id do auth user (ver lib/supabase/auth.ts).
  const { data: internal } = await sb
    .from("users_internal")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (internal?.role !== "doctor" && internal?.role !== "super_admin") {
    return { error: "Só um profissional pode decidir a revisão clínica." };
  }

  const result = await decideClinicalReview(orderId, decision, internal.id, notes);
  if ("error" in result) {
    return { error: MENSAGENS[result.error] ?? "Não foi possível registrar a decisão." };
  }

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { ok: true };
}
