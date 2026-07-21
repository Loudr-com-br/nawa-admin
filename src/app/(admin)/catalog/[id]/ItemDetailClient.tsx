"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
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
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import PublishStatusChip from "@/components/PublishStatusChip";
import Glp1Tag from "@/components/orders/Glp1Tag";
import { MedicalOnlyChip } from "../VisibilityChip";
import {
  formatBRL,
  computeMargin,
  compositionRaw,
  forcesMedicalOnly,
  isSupplierOwnedReadOnly,
  itemTypes,
  itemTypeLabels,
  pharmaceuticalForms,
  formLabels,
  visibilityLabels,
  supplierTypeLabels,
  type Item,
  type ItemType,
  type PharmaceuticalForm,
  type Visibility,
} from "@/lib/catalog/types";
import { saveItem, setItemStatus, deleteItem } from "../actions";
import { useToast } from "@/components/ToastProvider";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ItemDetailClient({ item }: { item: Item }) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const supplierReadOnly = isSupplierOwnedReadOnly(item.supplierType);

  // Diálogo de edição
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    name: item.name, slug: item.slug, itemType: item.itemType,
    pharmaceuticalForm: item.pharmaceuticalForm,
    price: String(item.price), cost: item.cost == null ? "" : String(item.cost),
    visibility: item.visibility, sellsStandalone: item.sellsStandalone,
    isGlp1: item.isGlp1, description: item.description ?? "",
    compositionRaw: compositionRaw(item.composition) ?? "", externalRef: item.externalRef ?? "",
  });
  const medLocked = forcesMedicalOnly(form.itemType);

  const margin = computeMargin(item.price, item.cost);
  const comp = compositionRaw(item.composition);

  async function togglePublish() {
    setBusy(true);
    const next = item.status === "published" ? "draft" : "published";
    const result = await setItemStatus(item.id, next);
    setBusy(false);
    if (!result.ok) { toast.error(result.error); return; }
    toast.success(next === "published" ? "Item publicado" : "Item despublicado");
    router.refresh();
  }

  function openEdit() {
    setError(null);
    setConfirmDelete(false);
    setForm({
      name: item.name, slug: item.slug, itemType: item.itemType,
      pharmaceuticalForm: item.pharmaceuticalForm,
      price: String(item.price), cost: item.cost == null ? "" : String(item.cost),
      visibility: item.visibility, sellsStandalone: item.sellsStandalone,
      isGlp1: item.isGlp1, description: item.description ?? "",
      compositionRaw: compositionRaw(item.composition) ?? "", externalRef: item.externalRef ?? "",
    });
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setBusy(true);
    const result = await saveItem(item.id, {
      name: form.name, slug: form.slug, supplierId: item.supplierId,
      itemType: form.itemType,
      visibility: medLocked ? "medical_only" : form.visibility,
      sellsStandalone: form.sellsStandalone, isGlp1: form.isGlp1,
      price: Number(form.price) || 0,
      pharmaceuticalForm: form.pharmaceuticalForm,
      description: form.description || null,
      cost: form.cost === "" ? null : Number(form.cost),
      externalRef: form.externalRef || null,
      compositionRaw: form.compositionRaw || null,
      status: item.status,
    });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    toast.success("Item atualizado");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    const result = await deleteItem(item.id);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    toast.success("Item excluído");
    router.push("/catalog");
  }

  return (
    <Box sx={{ maxWidth: 1160 }}>
      <Button component={Link} href="/catalog" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Catálogo
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">{item.name}</Typography>
            {item.isGlp1 && <Glp1Tag />}
            {item.visibility === "medical_only" && <MedicalOnlyChip />}
            <PublishStatusChip status={item.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {item.supplierName} · {itemTypeLabels[item.itemType]}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={openEdit} disabled={busy}>Editar</Button>
          <Button variant={item.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
            {item.status === "published" ? "Despublicar" : "Publicar"}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Descrição" icon={ScienceRoundedIcon}>
              <Typography variant="body2" color={item.description ? "text.primary" : "text.disabled"}>
                {item.description || "Sem descrição."}
              </Typography>
            </SectionCard>

            <SectionCard title="Composição e cuidados" icon={ScienceRoundedIcon}>
              <DefRow label="Composição">
                <Typography variant="body2" color={comp ? "text.primary" : "text.disabled"}>
                  {comp || "—"}
                </Typography>
              </DefRow>
              {item.cautions.length === 0 ? (
                <DefRow label="Cuidados"><Typography variant="body2" color="text.disabled">Nenhum</Typography></DefRow>
              ) : (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>Cuidados</Typography>
                  <Stack spacing={0.5}>
                    {item.cautions.map((c, idx) => (
                      <Typography key={idx} variant="body2">• {c.description}</Typography>
                    ))}
                  </Stack>
                </Box>
              )}
              {supplierReadOnly && (
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                  Dados do fornecedor — somente leitura. Alterados no sync.
                </Typography>
              )}
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Preço e visibilidade" icon={PaymentsRoundedIcon}>
              <DefRow label="Preço (NAWA)">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBRL(item.price)}</Typography>
              </DefRow>
              <DefRow label="Custo (fornecedor)">
                <Typography variant="body2" color={item.cost == null ? "text.disabled" : "text.primary"}>
                  {item.cost == null ? "Não informado" : formatBRL(item.cost)}
                </Typography>
              </DefRow>
              <DefRow label="Margem">
                <Typography variant="body2" color={margin == null ? "text.disabled" : "text.primary"}>
                  {margin == null ? "—" : `${margin.toFixed(0)}%`}
                </Typography>
              </DefRow>
              <DefRow label="Visibilidade">
                {item.visibility === "medical_only" ? <MedicalOnlyChip /> : <Typography variant="body2">Pública</Typography>}
              </DefRow>
              <DefRow label="Vende avulso">
                <Typography variant="body2">{item.sellsStandalone ? "Sim" : "Não"}</Typography>
              </DefRow>
            </SectionCard>

            <SectionCard title="Origem (fornecedor)" icon={FactoryRoundedIcon}>
              <DefRow label="Fornecedor">
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.supplierName}</Typography>
              </DefRow>
              <DefRow label="Tipo">
                <Typography variant="body2" color="text.secondary">{supplierTypeLabels[item.supplierType]}</Typography>
              </DefRow>
              <DefRow label="Forma">
                <Typography variant="body2" color="text.secondary">{formLabels[item.pharmaceuticalForm]}</Typography>
              </DefRow>
              <DefRow label="Ref. externa">
                {item.externalRef
                  ? <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{item.externalRef}</Typography>
                  : <Typography variant="body2" color="text.disabled">—</Typography>}
              </DefRow>
              <DefRow label="Slug">
                <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{item.slug}</Typography>
              </DefRow>
              <DefRow label="Sincronizado">
                <Typography variant="body2" color="text.secondary">{formatDate(item.syncedAt)}</Typography>
              </DefRow>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Diálogo de edição */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar item</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField select label="Tipo" value={form.itemType}
                onChange={(e) => {
                  const itemType = e.target.value as ItemType;
                  setForm((f) => ({ ...f, itemType, visibility: forcesMedicalOnly(itemType) ? "medical_only" : f.visibility }));
                }} fullWidth>
                {itemTypes.map((t) => <MenuItem key={t} value={t}>{itemTypeLabels[t]}</MenuItem>)}
              </TextField>
              <TextField select label="Forma" value={form.pharmaceuticalForm}
                onChange={(e) => setForm({ ...form, pharmaceuticalForm: e.target.value as PharmaceuticalForm })}
                disabled={supplierReadOnly} fullWidth
                helperText={supplierReadOnly ? "Do fornecedor" : undefined}>
                {pharmaceuticalForms.map((f) => <MenuItem key={f} value={f}>{formLabels[f]}</MenuItem>)}
              </TextField>
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Preço (NAWA)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} fullWidth
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
              <TextField label="Custo" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} fullWidth
                disabled={supplierReadOnly} helperText={supplierReadOnly ? "Do fornecedor" : "Opcional"}
                slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
            </Stack>
            <TextField select label="Visibilidade" value={form.visibility}
              onChange={(e) => setForm({ ...form, visibility: e.target.value as Visibility })}
              disabled={medLocked}
              helperText={medLocked ? "Medicamento é sempre só-médico." : undefined}>
              {(["public", "medical_only"] as Visibility[]).map((v) => (
                <MenuItem key={v} value={v}>{visibilityLabels[v]}</MenuItem>
              ))}
            </TextField>
            <TextField label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              multiline rows={2} disabled={supplierReadOnly} helperText={supplierReadOnly ? "Do fornecedor — somente leitura." : undefined} />
            <TextField label="Composição" value={form.compositionRaw} onChange={(e) => setForm({ ...form, compositionRaw: e.target.value })}
              multiline rows={2} disabled={supplierReadOnly} helperText={supplierReadOnly ? "Do fornecedor — somente leitura." : undefined} />
            <Stack direction="row" spacing={3}>
              <FormControlLabel control={<Switch checked={form.sellsStandalone} onChange={(e) => setForm({ ...form, sellsStandalone: e.target.checked })} />} label={<Typography variant="body2">Vende avulso</Typography>} />
              <FormControlLabel control={<Switch checked={form.isGlp1} onChange={(e) => setForm({ ...form, isGlp1: e.target.checked })} />} label={<Typography variant="body2">GLP-1</Typography>} />
            </Stack>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="error" onClick={handleDelete} disabled={busy}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
            <Button variant="contained" onClick={handleSave} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
