"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import PublishStatusChip from "@/components/PublishStatusChip";
import { saveJourney } from "./actions";
import { emptyContent, type Journey } from "@/lib/journeys/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

const columns: Column<Journey>[] = [
  { id: "name", label: "Jornada", sortable: true, sortAccessor: (j) => j.name, render: (j) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{j.name}</Typography> },
  { id: "plans", label: "Planos", align: "center", sortable: true, sortAccessor: (j) => j.planCount, render: (j) => <Chip label={j.planCount} size="small" variant="outlined" /> },
  { id: "status", label: "Status", sortable: true, sortAccessor: (j) => j.status, render: (j) => <PublishStatusChip status={j.status} /> },
  { id: "createdAt", label: "Criado", sortable: true, sortAccessor: (j) => new Date(j.createdAt).getTime(), render: (j) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(j.createdAt)}</Typography> },
];

const emptyForm = { name: "", slug: "", published: false };

export default function JourneysClient({ journeys }: { journeys: Journey[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const result = await saveJourney(null, { name: form.name, slug: form.slug, content: emptyContent(), status: form.published ? "published" : "draft" });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    if (result.id) router.push(`/journeys/${result.id}`);
    else router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Jornadas</Typography>
          <Typography variant="body1" color="text.secondary">
            Containers de experiência. Agrupam planos e definem posicionamento.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setForm(emptyForm); setError(null); setOpen(true); }}>
          Nova jornada
        </Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={journeys}
          getRowId={(j) => j.id}
          onRowClick={(j) => router.push(`/journeys/${j.id}`)}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={640}
          countLabel={["jornada", "jornadas"]}
          emptyMessage="Nenhuma jornada ainda. Crie a primeira."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Nova jornada</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Metabolic Reset" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="metabolic-reset" helperText="Identificador único." />
            <FormControlLabel control={<Switch checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicada <Typography component="span" variant="caption" color="text.secondary">(visível ao front)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Criar e configurar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
