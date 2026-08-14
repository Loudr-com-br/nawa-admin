"use client";

import { useState, useTransition } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { submitClinicalDecision } from "./review-actions";
import type { ClinicalReview } from "@/lib/orders/clinical-review";

// Gate clínico na tela do pedido. Aparece só quando há o que decidir, ou para
// mostrar a decisão já registrada — quem já foi revisado não volta a ser revisável.

export default function ClinicalReviewPanel({
  orderId,
  status,
  review,
  canDecide,
}: {
  orderId: string;
  status: string;
  review: ClinicalReview | null;
  /** Médico ou super admin. O operador vê, mas não decide. */
  canDecide: boolean;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decidir(decision: "approved" | "rejected") {
    setError(null);
    startTransition(async () => {
      const res = await submitClinicalDecision(orderId, decision, notes);
      if ("error" in res) setError(res.error);
    });
  }

  if (review) {
    return (
      <Stack spacing={1}>
        <Typography variant="body2">
          {review.decision === "approved"
            ? "Protocolo aprovado na revisão clínica."
            : "Protocolo reprovado na revisão clínica."}
        </Typography>
        {review.notes && (
          <Typography variant="body2" color="text.secondary">
            {review.notes}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {new Date(review.reviewedAt).toLocaleString("pt-BR")}
        </Typography>
      </Stack>
    );
  }

  if (status !== "in_clinical_review") {
    return (
      <Typography variant="body2" color="text.secondary">
        {status === "awaiting_payment"
          ? "A revisão começa quando o pagamento for confirmado."
          : "Este pedido não está na fila de revisão clínica."}
      </Typography>
    );
  }

  if (!canDecide) {
    return (
      <Typography variant="body2" color="text.secondary">
        Aguardando decisão de um profissional. Seu papel não permite decidir.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="body2" color="text.secondary">
        Avalie a composição do protocolo. Aprovar libera a produção; reprovar
        interrompe o pedido e exige justificativa — o paciente recebe o motivo.
      </Typography>

      <TextField
        label="Parecer clínico"
        placeholder="Obrigatório ao reprovar."
        multiline
        minRows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        fullWidth
      />

      {error && <Alert severity="warning">{error}</Alert>}

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button variant="contained" onClick={() => decidir("approved")} disabled={pending}>
          {pending ? "Registrando…" : "Aprovar protocolo"}
        </Button>
        <Button color="error" onClick={() => decidir("rejected")} disabled={pending}>
          Reprovar
        </Button>
      </Box>
    </Stack>
  );
}
