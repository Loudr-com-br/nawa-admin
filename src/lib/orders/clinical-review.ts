import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { captureAuthorizedPayment, releaseAuthorizedPayment } from "@/lib/payments/service";

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

// `enterClinicalReview` vive em payments/service.ts, e não aqui, para o grafo de
// imports ficar em uma direção só: a revisão clínica chama o pagamento (captura e
// liberação), nunca o contrário.

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

  // O dinheiro segue a decisão clínica: aprovar CAPTURA a autorização, reprovar
  // LIBERA o limite. Como nada foi capturado antes daqui, reprovar não gera
  // estorno — é a razão de o checkout autorizar em vez de cobrar.
  //
  // Se o movimento financeiro falhar, a decisão NÃO é registrada: um pedido
  // aprovado sem captura viraria produção sem receber, e um reprovado sem
  // liberação deixaria o limite do paciente preso.
  const money =
    decision === "approved"
      ? await captureAuthorizedPayment(orderId)
      : await releaseAuthorizedPayment(orderId);
  if ("error" in money) {
    return { error: "payment_action_failed", detail: money.detail ?? money.error };
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
