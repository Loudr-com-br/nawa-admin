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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import PublishStatusChip from "@/components/PublishStatusChip";
import { MedicalOnlyChip } from "@/components/VisibilityChip";
import { formatBRL } from "@/lib/catalog/types";
import {
  claimStatusLabels,
  claimStatusColor,
  hasDrift,
  type Protocol,
} from "@/lib/protocols/types";
import { createProtocol } from "./actions";
import { useToast } from "@/components/ToastProvider";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const columns: Column<Protocol>[] = [
  {
    id: "name", label: "Protocolo", sortable: true, sortAccessor: (p) => p.name,
    render: (p) => (
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography>
        {p.clinicalDescription && (
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 360 }}>
            {p.clinicalDescription}
          </Typography>
        )}
      </Box>
    ),
  },
  {
    id: "items", label: "Itens", align: "center", sortable: true, sortAccessor: (p) => p.itemCount,
    render: (p) => <Chip label={p.itemCount} size="small" variant="outlined" />,
  },
  {
    id: "price", label: "Preço", align: "right", sortable: true, sortAccessor: (p) => p.price,
    render: (p) => (
      <Box sx={{ textAlign: "right" }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(p.price)}</Typography>
        {hasDrift(p.price, p.itemsSum) && (
          <Typography variant="caption" color="warning.main" sx={{ whiteSpace: "nowrap" }}>
            soma {formatBRL(p.itemsSum)}
          </Typography>
        )}
      </Box>
    ),
  },
  {
    id: "visibility", label: "Visibilidade", sortable: true, sortAccessor: (p) => p.visibility,
    render: (p) => p.visibility === "medical_only"
      ? <MedicalOnlyChip />
      : <Typography variant="body2" color="text.secondary">Pública</Typography>,
  },
  {
    id: "claim", label: "Claim", sortable: true, sortAccessor: (p) => p.claimStatus,
    render: (p) => <Chip label={claimStatusLabels[p.claimStatus]} size="small" color={claimStatusColor[p.claimStatus]} variant="outlined" />,
  },
  {
    id: "status", label: "Status", sortable: true, sortAccessor: (p) => p.status,
    render: (p) => <PublishStatusChip status={p.status} />,
  },
];

const emptyForm = { name: "", slug: "", clinicalDescription: "" };

export default function ProtocolsClient({ protocols }: { protocols: Protocol[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const result = await createProtocol({
      name: form.name,
      slug: form.slug,
      clinicalDescription: form.clinicalDescription,
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    toast.success("Protocolo criado");
    if (result.id) router.push(`/protocols/${result.id}`);
    else router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Protocolos</Typography>
          <Typography variant="body1" color="text.secondary">
            Kits curados pela NAWA — combinam itens do catálogo com preço e página próprios.
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
          initialSort={{ columnId: "name", dir: "asc" }}
          minWidth={860}
          countLabel={["protocolo", "protocolos"]}
          emptyMessage="Nenhum protocolo ainda. Crie o primeiro."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Novo protocolo</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Reset Metabólico Avançado" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="reset-avancado" helperText="Identificador único." />
            <TextField label="Descrição clínica" value={form.clinicalDescription} onChange={(e) => setForm({ ...form, clinicalDescription: e.target.value })} multiline rows={3} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Criando…" : "Criar e escolher itens"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
