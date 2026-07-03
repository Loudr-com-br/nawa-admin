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
import { saveProtocol } from "./actions";
import type { Protocol } from "@/lib/protocols/types";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

const columns: Column<Protocol>[] = [
  { id: "name", label: "Protocolo", sortable: true, sortAccessor: (p) => p.name, render: (p) => (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
      {p.clinicalDescription && (
        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 360 }}>
          {p.clinicalDescription}
        </Typography>
      )}
    </Box>
  ) },
  { id: "formulas", label: "Fórmulas", align: "center", sortable: true, sortAccessor: (p) => p.formulaCount, render: (p) => (
    <Chip label={p.formulaCount} size="small" variant="outlined" />
  ) },
  { id: "origin", label: "Origem", sortable: true, sortAccessor: (p) => p.externalRef ?? "", render: (p) => (
    p.externalRef
      ? <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{p.externalRef}</Typography>
      : <Typography variant="body2" color="text.disabled">—</Typography>
  ) },
  { id: "status", label: "Status", sortable: true, sortAccessor: (p) => p.status, render: (p) => <PublishStatusChip status={p.status} /> },
  { id: "createdAt", label: "Criado", sortable: true, sortAccessor: (p) => new Date(p.createdAt).getTime(), render: (p) => (
    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</Typography>
  ) },
];

const emptyForm = { name: "", slug: "", clinicalDescription: "", externalRef: "", published: false };

export default function ProtocolsClient({ protocols }: { protocols: Protocol[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const result = await saveProtocol(null, {
      name: form.name,
      slug: form.slug,
      clinicalDescription: form.clinicalDescription,
      externalRef: form.externalRef || null,
      status: form.published ? "published" : "draft",
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    // vai direto ao detalhe para adicionar fórmulas
    if (result.id) router.push(`/protocols/${result.id}`);
    else router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Protocolos</Typography>
          <Typography variant="body1" color="text.secondary">
            Engine clínica: protocolos e fórmulas. Origem na Botane, enriquecidos aqui.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Novo protocolo
        </Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={protocols}
          getRowId={(p) => p.id}
          onRowClick={(p) => router.push(`/protocols/${p.id}`)}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={800}
          countLabel={["protocolo", "protocolos"]}
          emptyMessage="Nenhum protocolo ainda. Crie o primeiro."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Novo protocolo</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reset Metabólico Avançado" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="reset-avancado" helperText="Identificador único." />
            <TextField label="Descrição clínica" value={form.clinicalDescription} onChange={(e) => setForm({ ...form, clinicalDescription: e.target.value })} multiline rows={3} />
            <TextField label="Ref. Botane (external_ref)" value={form.externalRef} onChange={(e) => setForm({ ...form, externalRef: e.target.value })} placeholder="BOT-P-002" helperText="Vínculo com o registro de origem na Botane." />
            <FormControlLabel control={<Switch checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicado <Typography component="span" variant="caption" color="text.secondary">(visível ao front)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Criar e adicionar fórmulas"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
