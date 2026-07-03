"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import PublishStatusChip from "@/components/PublishStatusChip";
import { formatBRL, billingLabels } from "@/lib/catalog/types";
import type { JourneyDetail, PlanOption } from "@/lib/journeys/types";
import { saveJourney, attachPlan, detachPlan } from "../actions";

export default function JourneyDetailClient({
  journey,
  planOptions,
}: {
  journey: JourneyDetail;
  planOptions: PlanOption[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Editar jornada
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: journey.name,
    slug: journey.slug,
    tagline: journey.content.tagline,
    description: journey.content.description,
    highlights: journey.content.highlights.join("\n"),
  });
  const [error, setError] = useState<string | null>(null);

  // Vincular plano
  const [attachOpen, setAttachOpen] = useState(false);
  const [planId, setPlanId] = useState("");

  const attachable = planOptions.filter((p) => p.journeyId !== journey.id);

  async function togglePublish() {
    setBusy(true);
    await saveJourney(journey.id, {
      name: journey.name, slug: journey.slug, content: journey.content,
      status: journey.status === "published" ? "draft" : "published",
    });
    setBusy(false);
    router.refresh();
  }

  async function handleSaveEdit() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setBusy(true);
    const result = await saveJourney(journey.id, {
      name: form.name,
      slug: form.slug,
      content: {
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        highlights: form.highlights.split("\n").map((s) => s.trim()).filter(Boolean),
      },
      status: journey.status,
    });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setEditOpen(false);
    router.refresh();
  }

  async function handleAttach() {
    if (!planId) return;
    setBusy(true);
    await attachPlan(journey.id, planId);
    setBusy(false);
    setAttachOpen(false);
    setPlanId("");
    router.refresh();
  }

  async function handleDetach(id: string) {
    setBusy(true);
    await detachPlan(journey.id, id);
    setBusy(false);
    router.refresh();
  }

  return (
    <Box sx={{ maxWidth: 1000 }}>
      <Button component={Link} href="/journeys" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Jornadas
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">{journey.name}</Typography>
            <PublishStatusChip status={journey.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {journey.planCount} {journey.planCount === 1 ? "plano" : "planos"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={() => { setForm({ name: journey.name, slug: journey.slug, tagline: journey.content.tagline, description: journey.content.description, highlights: journey.content.highlights.join("\n") }); setError(null); setEditOpen(true); }}>
            Editar
          </Button>
          <Button variant={journey.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
            {journey.status === "published" ? "Despublicar" : "Publicar"}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 7 }}>
          <SectionCard title="Planos da jornada" icon={Inventory2RoundedIcon} action={
            <Button size="small" startIcon={<AddRoundedIcon />} onClick={() => setAttachOpen(true)}>Vincular plano</Button>
          }>
            {journey.plans.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                Nenhum plano vinculado. Vincule os planos que compõem esta jornada.
              </Typography>
            ) : (
              <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
                {journey.plans.map((p) => (
                  <Stack key={p.id} direction="row" alignItems="center" spacing={1} sx={{ py: 1.25 }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatBRL(p.basePrice)} · {billingLabels[p.billingInterval] ?? p.billingInterval}
                      </Typography>
                    </Box>
                    <PublishStatusChip status={p.status} />
                    <IconButton size="small" onClick={() => handleDetach(p.id)} disabled={busy} aria-label="Desvincular">
                      <CloseRoundedIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </SectionCard>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <SectionCard title="Conteúdo & posicionamento" icon={CampaignRoundedIcon}>
            <DefRow label="Tagline">
              <Typography variant="body2" color={journey.content.tagline ? "text.primary" : "text.disabled"}>
                {journey.content.tagline || "—"}
              </Typography>
            </DefRow>
            <Box sx={{ py: 0.75 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Descrição</Typography>
              <Typography variant="body2" color={journey.content.description ? "text.primary" : "text.disabled"}>
                {journey.content.description || "—"}
              </Typography>
            </Box>
            {journey.content.highlights.length > 0 && (
              <Box sx={{ pt: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Destaques</Typography>
                <Stack direction="row" spacing={0.75} flexWrap="wrap" sx={{ gap: 0.75 }}>
                  {journey.content.highlights.map((h, i) => <Chip key={i} label={h} size="small" variant="outlined" />)}
                </Stack>
              </Box>
            )}
          </SectionCard>
        </Grid>
      </Grid>

      {/* Editar jornada */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar jornada</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <TextField label="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Saúde contínua." />
            <TextField label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={3} />
            <TextField label="Destaques" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} multiline rows={3} placeholder={"Acompanhamento médico\nGLP-1 incluso"} helperText="Um destaque por linha." />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
        </DialogActions>
      </Dialog>

      {/* Vincular plano */}
      <Dialog open={attachOpen} onClose={() => setAttachOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Vincular plano</DialogTitle>
        <DialogContent>
          <TextField select label="Plano" value={planId} onChange={(e) => setPlanId(e.target.value)} fullWidth sx={{ mt: 0.5 }}>
            {attachable.length === 0 && <MenuItem value="" disabled>Nenhum plano disponível</MenuItem>}
            {attachable.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}{p.journeyId ? " (em outra jornada)" : ""}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAttachOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleAttach} disabled={busy || !planId}>Vincular</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
