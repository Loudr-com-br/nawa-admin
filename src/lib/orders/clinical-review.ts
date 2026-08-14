import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";

// Gate de validação clínica (spec §6.2, §7). O pedido pago não vai direto para a
// produção: para em `in_clinical_review` até um profissional decidir. É o que
// sustenta a posição da NAWA como plataforma que AGREGA — a responsabilidade
// clínica é de quem revisa, e essa decisão precisa ficar registrada com autor,
// data e justificativa.

export type ClinicalDecision = "approved" | "rejected";

export interface ClinicalReview {
  orderId: string;
  reviewerId: string | null;
  decision: ClinicalDecision;
  notes: string | null;
  reviewedAt: string;
}

export type ReviewResult = { ok: true; status: string } | { error: string; detail?: string };

/**
 * Coloca o pedido na fila clínica. Chamado quando o pagamento é confirmado.
 * Idempotente e guardado por estado: só sai de `paid`/`awaiting_payment`, então
 * um webhook repetido não puxa de volta um pedido que já foi revisado ou produzido.
 */
export async function enterClinicalReview(sb: any, orderId: string): Promise<void> {
  const { data: updated } = await sb
    .from("orders")
    .update({ status: "in_clinical_review" })
    .eq("id", orderId)
    .in("status", ["awaiting_payment", "paid"])
    .select("id");

  if (updated?.length) {
    await sb.from("order_events").insert({
      order_id: orderId,
      label: "Enviado para revisão clínica",
      description: "O protocolo aguarda validação de um profissional antes da produção.",
    });
  }
}

/**
 * Decisão do profissional. Aprovar libera a produção; reprovar interrompe o pedido.
 *
 * A transição é guardada por `.eq("status","in_clinical_review")`: um pedido que
 * não está na fila não pode ser aprovado por corrida ou por clique repetido — e a
 * unique em clinical_reviews garante uma decisão por pedido.
 */
export async function decideClinicalReview(
  orderId: string,
  decision: ClinicalDecision,
  reviewerId: string | null,
  notes?: string,
): Promise<ReviewResult> {
  const sb: any = createAdminClient();

  const { data: order } = await sb
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return { error: "order_not_found" };
  if (order.status !== "in_clinical_review") {
    return { error: "order_not_in_review", detail: order.status };
  }

  // Reprovar exige justificativa: é registro clínico, e o paciente vai receber o
  // motivo. Aprovar sem nota é aceitável.
  if (decision === "rejected" && !notes?.trim()) {
    return { error: "notes_required_for_rejection" };
  }

  const { error: reviewErr } = await sb.from("clinical_reviews").insert({
    order_id: orderId,
    reviewer_id: reviewerId,
    decision,
    notes: notes?.trim() || null,
  });
  if (reviewErr && !/duplicate key/i.test(reviewErr.message)) {
    return { error: "review_insert_failed", detail: reviewErr.message };
  }

  const nextStatus = decision === "approved" ? "in_production" : "clinically_rejected";
  const { data: updated } = await sb
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", orderId)
    .eq("status", "in_clinical_review")
    .select("id");
  if (!updated?.length) return { error: "order_not_in_review" };

  await sb.from("order_events").insert({
    order_id: orderId,
    label: decision === "approved" ? "Protocolo aprovado" : "Protocolo com ressalva",
    description:
      decision === "approved"
        ? "A revisão clínica aprovou a composição. O pedido segue para preparação."
        : notes?.trim() ?? "A revisão clínica não aprovou a composição.",
  });

  return { ok: true, status: nextStatus };
}

/** Fila da revisão clínica — o que espera decisão, mais antigo primeiro. */
export async function listPendingReviews() {
  const sb: any = createAdminClient();
  const { data } = await sb
    .from("orders")
    .select("id, total, created_at, patient:patients(name, email), order_items(name, quantity, is_glp1)")
    .eq("status", "in_clinical_review")
    .order("created_at", { ascending: true });

  return (data ?? []).map((o: any) => ({
    id: o.id,
    number: `#NAWA-${String(o.id).slice(0, 4).toUpperCase()}`,
    total: Number(o.total),
    createdAt: o.created_at,
    patientName: o.patient?.name ?? "—",
    patientEmail: o.patient?.email ?? "",
    items: (o.order_items ?? []).map((i: any) => ({
      name: i.name,
      quantity: i.quantity,
      isGlp1: i.is_glp1,
    })),
  }));
}

/** Decisão registrada de um pedido, se já houver. */
export async function getReview(orderId: string): Promise<ClinicalReview | null> {
  const sb: any = createAdminClient();
  const { data } = await sb
    .from("clinical_reviews")
    .select("*")
    .eq("order_id", orderId)
    .maybeSingle();
  if (!data) return null;
  return {
    orderId: data.order_id,
    reviewerId: data.reviewer_id,
    decision: data.decision,
    notes: data.notes,
    reviewedAt: data.reviewed_at,
  };
}
