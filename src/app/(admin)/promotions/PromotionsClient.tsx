"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputAdornment from "@mui/material/InputAdornment";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import PublishStatusChip from "@/components/PublishStatusChip";
import { savePromotion, deletePromotion } from "./actions";
import { useToast } from "@/components/ToastProvider";
import {
  formatPromotionValue,
  promotionTypeLabels,
  validityState,
  type Promotion,
  type PromotionType,
} from "@/lib/promotions/types";

function fmtDate(iso: string | null) {
  if (!iso) return null;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}
function toDateInput(iso: string | null) {
  return iso ? iso.slice(0, 10) : "";
}

const validityLabels: Record<string, string> = { active: "Ativa", scheduled: "Agendada", expired: "Expirada", none: "Sem período" };
const validityColors: Record<string, string> = { active: "#22C55E", scheduled: "#F59E0B", expired: "#94A3B8", none: "#94A3B8" };

function Validity({ p }: { p: Promotion }) {
  const state = validityState(p.validFrom, p.validTo);
  const from = fmtDate(p.validFrom);
  const to = fmtDate(p.validTo);
  const range = from && to ? `${from} – ${to}` : from ? `A partir de ${from}` : to ? `Até ${to}` : "—";
  return (
    <Box>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: validityColors[state] }} />
        <Typography variant="body2">{validityLabels[state]}</Typography>
      </Stack>
      <Typography variant="caption" color="text.secondary">{range}</Typography>
    </Box>
  );
}

const emptyForm = { code: "", type: "percent" as PromotionType, value: "", validFrom: "", validTo: "", published: false };

export default function PromotionsClient({ promotions }: { promotions: Promotion[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const columns: Column<Promotion>[] = [
    { id: "code", label: "Código", sortable: true, sortAccessor: (p) => p.code, render: (p) => <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: "monospace" }}>{p.code}</Typography> },
    { id: "type", label: "Tipo", sortable: true, sortAccessor: (p) => p.type, render: (p) => <Typography variant="body2" color="text.secondary">{promotionTypeLabels[p.type]}</Typography> },
    { id: "value", label: "Desconto", align: "right", sortable: true, sortAccessor: (p) => p.value, render: (p) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatPromotionValue(p.type, p.value)}</Typography> },
    { id: "validity", label: "Vigência", render: (p) => <Validity p={p} /> },
    { id: "status", label: "Status", sortable: true, sortAccessor: (p) => p.status, render: (p) => <PublishStatusChip status={p.status} /> },
  ];

  function openNew() { setEditing(null); setForm(emptyForm); setError(null); setConfirmDelete(false); setOpen(true); }
  function openEdit(p: Promotion) {
    setEditing(p);
    setForm({ code: p.code, type: p.type, value: String(p.value), validFrom: toDateInput(p.validFrom), validTo: toDateInput(p.validTo), published: p.status === "published" });
    setError(null); setConfirmDelete(false); setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.code.trim()) { setError("Preencha o código."); return; }
    setSaving(true);
    const result = await savePromotion(editing?.id ?? null, {
      code: form.code,
      type: form.type,
      value: Number(form.value) || 0,
      validFrom: form.validFrom || null,
      validTo: form.validTo || null,
      status: form.published ? "published" : "draft",
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false); toast.success(editing ? "Promoção atualizada" : "Promoção criada"); router.refresh();
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const result = await deletePromotion(editing.id);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false); toast.success("Promoção excluída"); router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Promoções</Typography>
          <Typography variant="body1" color="text.secondary">
            Cupons e descontos por período. Aplicados no checkout do front.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>Nova promoção</Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={promotions}
          getRowId={(p) => p.id}
          onRowClick={openEdit}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={760}
          countLabel={["promoção", "promoções"]}
          emptyMessage="Nenhuma promoção ainda. Crie a primeira."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Editar promoção" : "Nova promoção"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Código" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="RESET10" autoFocus
              slotProps={{ htmlInput: { style: { fontFamily: "monospace", textTransform: "uppercase" } } }} />
            <Stack direction="row" spacing={2}>
              <TextField select label="Tipo" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as PromotionType })} fullWidth>
                <MenuItem value="percent">{promotionTypeLabels.percent}</MenuItem>
                <MenuItem value="fixed">{promotionTypeLabels.fixed}</MenuItem>
              </TextField>
              <TextField label="Valor" type="number" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} fullWidth
                slotProps={{ input: form.type === "percent"
                  ? { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                  : { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Válido de" type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
              <TextField label="Válido até" type="date" value={form.validTo} onChange={(e) => setForm({ ...form, validTo: e.target.value })} fullWidth slotProps={{ inputLabel: { shrink: true } }} />
            </Stack>
            <FormControlLabel control={<Switch checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicada <Typography component="span" variant="caption" color="text.secondary">(ativa no checkout)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>{editing && <Button color="error" onClick={handleDelete} disabled={saving}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>}</Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
