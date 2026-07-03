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
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import {
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from "./actions";
import { useToast } from "@/components/ToastProvider";
import {
  attributeTypes,
  scopeLabels,
  typeLabels,
  type Attribute,
  type AttributeScope,
} from "@/lib/attributes/types";

const scopeOrder: AttributeScope[] = ["catalog", "protocol", "journey"];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const columns: Column<Attribute>[] = [
  {
    id: "label",
    label: "Nome",
    sortable: true,
    sortAccessor: (a) => a.label,
    render: (a) => (
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {a.label}
      </Typography>
    ),
  },
  {
    id: "key",
    label: "Chave",
    sortable: true,
    sortAccessor: (a) => a.key,
    render: (a) => (
      <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">
        {a.key}
      </Typography>
    ),
  },
  {
    id: "scope",
    label: "Escopo",
    sortable: true,
    sortAccessor: (a) => a.scope,
    render: (a) => <Chip label={scopeLabels[a.scope]} size="small" variant="outlined" />,
  },
  {
    id: "type",
    label: "Tipo",
    sortable: true,
    sortAccessor: (a) => a.type,
    render: (a) => (
      <Typography variant="body2" color="text.secondary">
        {typeLabels[a.type] ?? a.type}
      </Typography>
    ),
  },
  {
    id: "createdAt",
    label: "Criado",
    sortable: true,
    sortAccessor: (a) => new Date(a.createdAt).getTime(),
    render: (a) => (
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
        {formatDate(a.createdAt)}
      </Typography>
    ),
  },
];

const emptyForm = { scope: "catalog" as AttributeScope, label: "", key: "", type: "text" };

export default function AttributesClient({ attributes }: { attributes: Attribute[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  function openEdit(a: Attribute) {
    setEditing(a);
    setForm({ scope: a.scope, label: a.label, key: a.key, type: a.type });
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.label.trim() || !form.key.trim()) {
      setError("Preencha nome e chave.");
      return;
    }
    setSaving(true);
    const result = editing
      ? await updateAttribute(editing.id, form)
      : await createAttribute(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success(editing ? "Atributo atualizado" : "Atributo criado");
    router.refresh();
  }

  async function handleDelete() {
    if (!editing) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    const result = await deleteAttribute(editing.id);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setOpen(false);
    toast.success("Atributo excluído");
    router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
            Nomenclatura
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Atributos, categorias e tags que amarram catálogo, protocolos e jornadas.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Novo atributo
        </Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={attributes}
          getRowId={(a) => a.id}
          onRowClick={openEdit}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={720}
          countLabel={["atributo", "atributos"]}
          emptyMessage="Nenhum atributo ainda. Crie o primeiro."
        />
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editing ? "Editar atributo" : "Novo atributo"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Categoria metabólica"
              autoFocus
            />
            <TextField
              label="Chave"
              value={form.key}
              onChange={(e) => setForm({ ...form, key: e.target.value })}
              placeholder="categoria_metabolica"
              helperText="Identificador técnico, único por escopo."
            />
            <TextField
              select
              label="Escopo"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value as AttributeScope })}
            >
              {scopeOrder.map((s) => (
                <MenuItem key={s} value={s}>
                  {scopeLabels[s]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Tipo"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {attributeTypes.map((t) => (
                <MenuItem key={t} value={t}>
                  {typeLabels[t]}
                </MenuItem>
              ))}
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>
            {editing && (
              <Button color="error" onClick={handleDelete} disabled={saving}>
                {confirmDelete ? "Confirmar exclusão" : "Excluir"}
              </Button>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : "Salvar"}
            </Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
