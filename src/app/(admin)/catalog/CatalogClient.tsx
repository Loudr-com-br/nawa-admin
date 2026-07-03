"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
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
import {
  billingIntervals,
  billingLabels,
  formatBRL,
  type Plan,
  type CommercialProduct,
  type RefOption,
} from "@/lib/catalog/types";
import {
  savePlan,
  deletePlan,
  saveProduct,
  deleteProduct,
} from "./actions";
import { useToast } from "@/components/ToastProvider";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

// ── Colunas ──
const planColumns: Column<Plan>[] = [
  { id: "name", label: "Nome", sortable: true, sortAccessor: (p) => p.name, render: (p) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography> },
  { id: "journey", label: "Jornada", sortable: true, sortAccessor: (p) => p.journeyName, render: (p) => <Typography variant="body2" color="text.secondary">{p.journeyName}</Typography> },
  { id: "price", label: "Preço base", align: "right", sortable: true, sortAccessor: (p) => p.basePrice, render: (p) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(p.basePrice)}</Typography> },
  { id: "billing", label: "Recorrência", sortable: true, sortAccessor: (p) => p.billingInterval, render: (p) => <Typography variant="body2" color="text.secondary">{billingLabels[p.billingInterval] ?? p.billingInterval}</Typography> },
  { id: "status", label: "Status", sortable: true, sortAccessor: (p) => p.status, render: (p) => <PublishStatusChip status={p.status} /> },
  { id: "createdAt", label: "Criado", sortable: true, sortAccessor: (p) => new Date(p.createdAt).getTime(), render: (p) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</Typography> },
];

const productColumns: Column<CommercialProduct>[] = [
  { id: "name", label: "Nome", sortable: true, sortAccessor: (p) => p.name, render: (p) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{p.name}</Typography> },
  { id: "ref", label: "Referência", sortable: true, sortAccessor: (p) => (p.refId ? p.refType : ""), render: (p) => <Typography variant="body2" color={p.refId ? "text.secondary" : "text.disabled"}>{p.refId ? (p.refType === "plan" ? "Plano" : "Fórmula") : "—"}</Typography> },
  { id: "price", label: "Preço", align: "right", sortable: true, sortAccessor: (p) => p.price, render: (p) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(p.price)}</Typography> },
  { id: "addon", label: "Add-on", sortable: true, sortAccessor: (p) => (p.isAddon ? 1 : 0), render: (p) => (p.isAddon ? <Chip label="Add-on" size="small" variant="outlined" /> : <Typography variant="body2" color="text.disabled">—</Typography>) },
  { id: "status", label: "Status", sortable: true, sortAccessor: (p) => p.status, render: (p) => <PublishStatusChip status={p.status} /> },
];

const emptyPlan = {
  name: "", slug: "", journeyId: "", basePrice: "", billingInterval: "monthly", inclusions: "", published: false,
};
const emptyProduct = {
  name: "", refId: "", price: "", isAddon: false, published: false,
};

export default function CatalogClient({
  plans, products, journeys, refOptions,
}: {
  plans: Plan[];
  products: CommercialProduct[];
  journeys: { id: string; name: string }[];
  refOptions: RefOption[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Plan dialog
  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState(emptyPlan);

  // Product dialog
  const [prodOpen, setProdOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CommercialProduct | null>(null);
  const [prodForm, setProdForm] = useState(emptyProduct);

  function openNew() {
    setError(null);
    setConfirmDelete(false);
    if (tab === 0) {
      setEditingPlan(null);
      setPlanForm(emptyPlan);
      setPlanOpen(true);
    } else {
      setEditingProduct(null);
      setProdForm(emptyProduct);
      setProdOpen(true);
    }
  }

  function openPlan(p: Plan) {
    setError(null); setConfirmDelete(false);
    setEditingPlan(p);
    setPlanForm({
      name: p.name, slug: p.slug, journeyId: p.journeyId ?? "",
      basePrice: String(p.basePrice), billingInterval: p.billingInterval,
      inclusions: p.inclusions.join("\n"), published: p.status === "published",
    });
    setPlanOpen(true);
  }

  function openProduct(p: CommercialProduct) {
    setError(null); setConfirmDelete(false);
    setEditingProduct(p);
    setProdForm({ name: p.name, refId: p.refId ?? "", price: String(p.price), isAddon: p.isAddon, published: p.status === "published" });
    setProdOpen(true);
  }

  async function handleSavePlan() {
    setError(null);
    if (!planForm.name.trim() || !planForm.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const result = await savePlan(editingPlan?.id ?? null, {
      name: planForm.name,
      slug: planForm.slug,
      journeyId: planForm.journeyId || null,
      basePrice: Number(planForm.basePrice) || 0,
      billingInterval: planForm.billingInterval,
      inclusions: planForm.inclusions.split("\n").map((s) => s.trim()).filter(Boolean),
      status: planForm.published ? "published" : "draft",
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setPlanOpen(false); toast.success(editingPlan ? "Plano atualizado" : "Plano criado"); router.refresh();
  }

  async function handleDeletePlan() {
    if (!editingPlan) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const result = await deletePlan(editingPlan.id);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setPlanOpen(false); toast.success("Plano excluído"); router.refresh();
  }

  async function handleSaveProduct() {
    setError(null);
    if (!prodForm.name.trim()) { setError("Preencha o nome."); return; }
    const ref = refOptions.find((r) => r.id === prodForm.refId);
    setSaving(true);
    const result = await saveProduct(editingProduct?.id ?? null, {
      name: prodForm.name,
      refType: ref?.refType ?? "plan",
      refId: prodForm.refId || null,
      price: Number(prodForm.price) || 0,
      isAddon: prodForm.isAddon,
      status: prodForm.published ? "published" : "draft",
    });
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setProdOpen(false); toast.success(editingProduct ? "Produto atualizado" : "Produto criado"); router.refresh();
  }

  async function handleDeleteProduct() {
    if (!editingProduct) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    const result = await deleteProduct(editingProduct.id);
    setSaving(false);
    if (!result.ok) { setError(result.error); return; }
    setProdOpen(false); toast.success("Produto excluído"); router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Catálogo</Typography>
          <Typography variant="body1" color="text.secondary">
            Planos e produtos comerciais. Só o que está publicado é servido ao front.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>
          {tab === 0 ? "Novo plano" : "Novo produto"}
        </Button>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Planos" />
        <Tab label="Produtos" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <DataTable
            columns={planColumns}
            rows={plans}
            getRowId={(p) => p.id}
            onRowClick={openPlan}
            initialSort={{ columnId: "createdAt", dir: "desc" }}
            minWidth={760}
            countLabel={["plano", "planos"]}
            emptyMessage="Nenhum plano ainda. Crie o primeiro."
          />
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <DataTable
            columns={productColumns}
            rows={products}
            getRowId={(p) => p.id}
            onRowClick={openProduct}
            initialSort={{ columnId: "name", dir: "asc" }}
            minWidth={680}
            countLabel={["produto", "produtos"]}
            emptyMessage="Nenhum produto ainda. Crie o primeiro."
          />
        </Card>
      )}

      {/* Diálogo de Plano */}
      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editingPlan ? "Editar plano" : "Novo plano"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} placeholder="Plus" autoFocus />
            <TextField label="Slug" value={planForm.slug} onChange={(e) => setPlanForm({ ...planForm, slug: e.target.value })} placeholder="plus" helperText="Identificador único do plano." />
            <TextField select label="Jornada" value={planForm.journeyId} onChange={(e) => setPlanForm({ ...planForm, journeyId: e.target.value })}>
              <MenuItem value="">Nenhuma</MenuItem>
              {journeys.map((j) => <MenuItem key={j.id} value={j.id}>{j.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField label="Preço base" type="number" value={planForm.basePrice} onChange={(e) => setPlanForm({ ...planForm, basePrice: e.target.value })}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
              <TextField select label="Recorrência" value={planForm.billingInterval} onChange={(e) => setPlanForm({ ...planForm, billingInterval: e.target.value })} sx={{ minWidth: 160 }}>
                {billingIntervals.map((b) => <MenuItem key={b} value={b}>{billingLabels[b]}</MenuItem>)}
              </TextField>
            </Stack>
            <TextField label="Inclusões" value={planForm.inclusions} onChange={(e) => setPlanForm({ ...planForm, inclusions: e.target.value })}
              multiline rows={3} placeholder={"Acompanhamento médico\nGLP-1 incluso"} helperText="Uma inclusão por linha." />
            <FormControlLabel control={<Switch checked={planForm.published} onChange={(e) => setPlanForm({ ...planForm, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicado <Typography component="span" variant="caption" color="text.secondary">(visível ao front)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>{editingPlan && <Button color="error" onClick={handleDeletePlan} disabled={saving}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>}</Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setPlanOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={handleSavePlan} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Diálogo de Produto */}
      <Dialog open={prodOpen} onClose={() => setProdOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editingProduct ? "Editar produto" : "Novo produto"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} placeholder="Kit aplicação" autoFocus />
            <TextField select label="Referência" value={prodForm.refId} onChange={(e) => setProdForm({ ...prodForm, refId: e.target.value })} helperText="Plano ou fórmula que este produto representa.">
              <MenuItem value="">Nenhuma</MenuItem>
              {refOptions.map((r) => <MenuItem key={r.id} value={r.id}>{r.label}</MenuItem>)}
            </TextField>
            <TextField label="Preço" type="number" value={prodForm.price} onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
            <FormControlLabel control={<Switch checked={prodForm.isAddon} onChange={(e) => setProdForm({ ...prodForm, isAddon: e.target.checked })} />} label={<Typography variant="body2">Add-on</Typography>} />
            <FormControlLabel control={<Switch checked={prodForm.published} onChange={(e) => setProdForm({ ...prodForm, published: e.target.checked })} />}
              label={<Typography variant="body2">Publicado <Typography component="span" variant="caption" color="text.secondary">(visível ao front)</Typography></Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>{editingProduct && <Button color="error" onClick={handleDeleteProduct} disabled={saving}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>}</Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setProdOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveProduct} disabled={saving}>{saving ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
