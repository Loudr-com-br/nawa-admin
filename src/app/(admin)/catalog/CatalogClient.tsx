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
import Glp1Tag from "@/components/orders/Glp1Tag";
import { MedicalOnlyChip } from "@/components/VisibilityChip";
import {
  formatBRL,
  computeMargin,
  forcesMedicalOnly,
  itemTypes,
  itemTypeLabels,
  pharmaceuticalForms,
  formLabels,
  visibilityLabels,
  type Item,
  type ItemType,
  type PharmaceuticalForm,
  type SupplierOption,
  type Visibility,
} from "@/lib/catalog/types";
import { saveItem } from "./actions";
import { useToast } from "@/components/ToastProvider";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function fmtMargin(price: number, cost: number | null) {
  const m = computeMargin(price, cost);
  return m == null ? "—" : `${m.toFixed(0)}%`;
}

const columns: Column<Item>[] = [
  {
    id: "name", label: "Item", sortable: true, sortAccessor: (i) => i.name,
    render: (i) => (
      <Stack direction="row" spacing={0.75} alignItems="center">
        <Typography variant="body2" sx={{ fontWeight: 500 }}>{i.name}</Typography>
        {i.isGlp1 && <Glp1Tag />}
      </Stack>
    ),
  },
  {
    id: "supplier", label: "Fornecedor", sortable: true, sortAccessor: (i) => i.supplierName,
    render: (i) => <Typography variant="body2" color="text.secondary">{i.supplierName}</Typography>,
  },
  {
    id: "type", label: "Tipo", sortable: true, sortAccessor: (i) => i.itemType,
    render: (i) => <Typography variant="body2" color="text.secondary">{itemTypeLabels[i.itemType]}</Typography>,
  },
  {
    id: "price", label: "Preço", align: "right", sortable: true, sortAccessor: (i) => i.price,
    render: (i) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(i.price)}</Typography>,
  },
  {
    id: "margin", label: "Margem", align: "right", sortable: true,
    sortAccessor: (i) => computeMargin(i.price, i.cost) ?? -1,
    render: (i) => <Typography variant="body2" color="text.secondary">{fmtMargin(i.price, i.cost)}</Typography>,
  },
  {
    id: "visibility", label: "Visibilidade", sortable: true, sortAccessor: (i) => i.visibility,
    render: (i) => i.visibility === "medical_only"
      ? <MedicalOnlyChip />
      : <Typography variant="body2" color="text.secondary">Pública</Typography>,
  },
  {
    id: "status", label: "Status", sortable: true, sortAccessor: (i) => i.status,
    render: (i) => <PublishStatusChip status={i.status} />,
  },
];

const emptyForm = {
  name: "", slug: "", supplierId: "", itemType: "manipulado" as ItemType,
  pharmaceuticalForm: "capsula" as PharmaceuticalForm,
  price: "", cost: "", visibility: "medical_only" as Visibility,
  sellsStandalone: true, isGlp1: false, description: "", compositionRaw: "",
  externalRef: "", published: false,
};

export default function CatalogClient({
  items, suppliers,
}: {
  items: Item[];
  suppliers: SupplierOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const medLocked = forcesMedicalOnly(form.itemType);

  function openNew() {
    setError(null);
    setForm({ ...emptyForm, supplierId: suppliers[0]?.id ?? "" });
    setOpen(true);
  }

  function setName(name: string) {
    setForm((f) => ({ ...f, name, slug: f.slug || slugify(name) }));
  }

  function setItemType(itemType: ItemType) {
    setForm((f) => ({
      ...f, itemType,
      visibility: forcesMedicalOnly(itemType) ? "medical_only" : f.visibility,
    }));
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    if (!form.supplierId) { setError("Selecione um fornecedor."); return; }
    setSaving(true);
    const result = await saveItem(null, {
      name: form.name,
      slug: form.slug,
      supplierId: form.supplierId,
      itemType: form.itemType,
      visibility: medLocked ? "medical_only" : form.visibility,
      sellsStandalone: form.sellsStandalone,
      isGlp1: form.isGlp1,
      price: Number(form.price) || 0,
      pharmaceuticalForm: form.pharmaceuticalForm,
      description: form.description || null,
      cost: form.cost === "" ? null : Number(form.cost),
      externalRef: form.externalRef || null,
      compositionRaw: form.compositionRaw || null,
      status: form.published ? "published" : "draft",
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    toast.success("Item criado");
    router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Catálogo</Typography>
          <Typography variant="body1" color="text.secondary">
            Itens e SKUs — o inventário do que existe para vender, venha da Botane, de parceiro ou da NAWA.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>
          Novo item
        </Button>
      </Stack>

      <Card>
        <DataTable
          columns={columns}
          rows={items}
          getRowId={(i) => i.id}
          onRowClick={(i) => router.push(`/catalog/${i.id}`)}
          initialSort={{ columnId: "name", dir: "asc" }}
          minWidth={860}
          countLabel={["item", "itens"]}
          emptyMessage="Nenhum item ainda. Crie o primeiro."
        />
      </Card>

      {/* Diálogo de novo item */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Novo item</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setName(e.target.value)} placeholder="Ômega-3 EPA/DHA" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="omega-3" helperText="Identificador único." />
            <TextField select label="Fornecedor" value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
              {suppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField select label="Tipo" value={form.itemType} onChange={(e) => setItemType(e.target.value as ItemType)} fullWidth>
                {itemTypes.map((t) => <MenuItem key={t} value={t}>{itemTypeLabels[t]}</MenuItem>)}
              </TextField>
              <TextField select label="Forma" value={form.pharmaceuticalForm} onChange={(e) => setForm({ ...form, pharmaceuticalForm: e.target.value as PharmaceuticalForm })} fullWidth>
                {pharmaceuticalForms.map((f) => <MenuItem key={f} value={f}>{formLabels[f]}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Preço (NAWA)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
              <TextField label="Custo (fornecedor)" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} fullWidth
                helperText="Opcional" slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
            </Stack>
            <TextField select label="Visibilidade" value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
              disabled={medLocked}
              helperText={medLocked ? "Medicamento é sempre só-médico." : "Pública aparece na vitrine; só-médico não."}>
              {(["public", "medical_only"] as Visibility[]).map((v) => (
                <MenuItem key={v} value={v}>{visibilityLabels[v]}</MenuItem>
              ))}
            </TextField>
            <TextField label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} placeholder="Texto descritivo (origem fornecedor)." />
            <TextField label="Composição" value={form.compositionRaw} onChange={(e) => setForm({ ...form, compositionRaw: e.target.value })} multiline rows={2} placeholder="1000mg — 660mg EPA / 440mg DHA" helperText="Descritiva, como no rótulo." />
            <TextField label="Ref. externa" value={form.externalRef} onChange={(e) => setForm({ ...form, externalRef: e.target.value })} placeholder="BOT-F-011" />
            <Stack direction="row" spacing={3}>
              <FormControlLabel control={<Switch checked={form.sellsStandalone} onChange={(e) => setForm({ ...form, sellsStandalone: e.target.checked })} />} label={<Typography variant="body2">Vende avulso</Typography>} />
              <FormControlLabel control={<Switch checked={form.isGlp1} onChange={(e) => setForm({ ...form, isGlp1: e.target.checked })} />} label={<Typography variant="body2">GLP-1</Typography>} />
            </Stack>
            <FormControlLabel control={<Switch checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicado <Typography component="span" variant="caption" color="text.secondary">(exige preço)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
