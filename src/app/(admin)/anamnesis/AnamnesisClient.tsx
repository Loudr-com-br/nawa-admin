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
import { saveForm } from "./actions";
import type { AnamnesisForm } from "@/lib/anamnesis/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

const columns: Column<AnamnesisForm>[] = [
  { id: "name", label: "Formulário", sortable: true, sortAccessor: (f) => f.name, render: (f) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{f.name}</Typography> },
  { id: "questions", label: "Perguntas", align: "center", sortable: true, sortAccessor: (f) => f.questionCount, render: (f) => <Chip label={f.questionCount} size="small" variant="outlined" /> },
  { id: "status", label: "Status", sortable: true, sortAccessor: (f) => f.status, render: (f) => <PublishStatusChip status={f.status} /> },
  { id: "createdAt", label: "Criado", sortable: true, sortAccessor: (f) => new Date(f.createdAt).getTime(), render: (f) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(f.createdAt)}</Typography> },
];

const emptyForm = { name: "", slug: "", published: false };

export default function AnamnesisClient({ forms }: { forms: AnamnesisForm[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const result = await saveForm(null, { name: form.name, slug: form.slug, status: form.published ? "published" : "draft" });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    if (result.id) router.push(`/anamnesis/${result.id}`);
    else router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Anamnese</Typography>
          <Typography variant="body1" color="text.secondary">
            Construtor de formulários multi-step. Renderizado pelo front.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setForm(emptyForm); setError(null); setOpen(true); }}>
          Novo formulário
        </Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={forms}
          getRowId={(f) => f.id}
          onRowClick={(f) => router.push(`/anamnesis/${f.id}`)}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={640}
          countLabel={["formulário", "formulários"]}
          emptyMessage="Nenhum formulário ainda. Crie o primeiro."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Novo formulário</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Anamnese — Metabolic Reset" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="metabolic-reset" helperText="Identificador único." />
            <FormControlLabel control={<Switch checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicado <Typography component="span" variant="caption" color="text.secondary">(visível ao front)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Criar e montar perguntas"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
