"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import FactoryRoundedIcon from "@mui/icons-material/FactoryRounded";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import PublishStatusChip from "@/components/PublishStatusChip";
import Glp1Tag from "@/components/orders/Glp1Tag";
import {
  formLabels,
  pharmaceuticalForms,
  supplierLabels,
  type ProtocolDetail,
  type Formula,
  type PharmaceuticalForm,
  type Supplier,
} from "@/lib/protocols/types";
import { saveProtocol, saveFormula, deleteFormula } from "../actions";

const emptyFormula = {
  name: "",
  pharmaceuticalForm: "capsule" as PharmaceuticalForm,
  dosage: "",
  supplier: "botane" as Supplier,
  isGlp1: false,
  externalRef: "",
  eligibilityNotes: "",
};

export default function ProtocolDetailClient({ protocol }: { protocol: ProtocolDetail }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Formula dialog
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Formula | null>(null);
  const [form, setForm] = useState(emptyFormula);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function togglePublish() {
    setBusy(true);
    await saveProtocol(protocol.id, {
      name: protocol.name,
      slug: protocol.slug,
      clinicalDescription: protocol.clinicalDescription,
      externalRef: protocol.externalRef,
      status: protocol.status === "published" ? "draft" : "published",
    });
    setBusy(false);
    router.refresh();
  }

  function openNewFormula() {
    setEditing(null);
    setForm(emptyFormula);
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  function openEditFormula(f: Formula) {
    setEditing(f);
    setForm({
      name: f.name,
      pharmaceuticalForm: f.pharmaceuticalForm,
      dosage: f.dosage,
      supplier: f.supplier,
      isGlp1: f.isGlp1,
      externalRef: f.externalRef ?? "",
      eligibilityNotes: f.eligibilityNotes,
    });
    setError(null);
    setConfirmDelete(false);
    setOpen(true);
  }

  async function handleSaveFormula() {
    setError(null);
    if (!form.name.trim()) { setError("Preencha o nome da fórmula."); return; }
    setBusy(true);
    const result = await saveFormula(editing?.id ?? null, {
      protocolId: protocol.id,
      name: form.name,
      pharmaceuticalForm: form.pharmaceuticalForm,
      dosage: form.dosage,
      supplier: form.supplier,
      isGlp1: form.isGlp1,
      externalRef: form.externalRef || null,
      eligibilityNotes: form.eligibilityNotes,
    });
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  async function handleDeleteFormula() {
    if (!editing) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    const result = await deleteFormula(editing.id, protocol.id);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <Box sx={{ maxWidth: 1160 }}>
      <Button component={Link} href="/protocols" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Protocolos
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">{protocol.name}</Typography>
            <PublishStatusChip status={protocol.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {protocol.formulaCount} {protocol.formulaCount === 1 ? "fórmula" : "fórmulas"}
          </Typography>
        </Box>
        <Button variant={protocol.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
          {protocol.status === "published" ? "Despublicar" : "Publicar"}
        </Button>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Descrição clínica" icon={ScienceRoundedIcon}>
              <Typography variant="body2" color={protocol.clinicalDescription ? "text.primary" : "text.disabled"}>
                {protocol.clinicalDescription || "Sem descrição."}
              </Typography>
            </SectionCard>

            <SectionCard
              title="Fórmulas"
              icon={ScienceRoundedIcon}
              action={
                <Button size="small" startIcon={<AddRoundedIcon />} onClick={openNewFormula}>
                  Adicionar
                </Button>
              }
            >
              {protocol.formulas.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Nenhuma fórmula. Um protocolo respeita a lógica farmacotécnica — adicione uma ou mais.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500 } }}>
                      <TableCell>Fórmula</TableCell>
                      <TableCell>Forma</TableCell>
                      <TableCell>Dosagem</TableCell>
                      <TableCell>Fornecedor</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {protocol.formulas.map((f) => (
                      <TableRow key={f.id} hover onClick={() => openEditFormula(f)} sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{f.name}</Typography>
                            {f.isGlp1 && <Glp1Tag />}
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{formLabels[f.pharmaceuticalForm]}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{f.dosage || "—"}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{supplierLabels[f.supplier]}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Origem (Botane)" icon={FactoryRoundedIcon}>
              <DefRow label="external_ref">
                {protocol.externalRef ? (
                  <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: "monospace" }}>{protocol.externalRef}</Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">Autoral (NAWA)</Typography>
                )}
              </DefRow>
              <DefRow label="Slug">
                <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{protocol.slug}</Typography>
              </DefRow>
              <DefRow label="Status">
                <PublishStatusChip status={protocol.status} />
              </DefRow>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Diálogo de Fórmula */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>{editing ? "Editar fórmula" : "Nova fórmula"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Semaglutida" autoFocus />
            <Stack direction="row" spacing={2}>
              <TextField select label="Forma farmacêutica" value={form.pharmaceuticalForm} onChange={(e) => setForm({ ...form, pharmaceuticalForm: e.target.value as PharmaceuticalForm })} fullWidth>
                {pharmaceuticalForms.map((f) => <MenuItem key={f} value={f}>{formLabels[f]}</MenuItem>)}
              </TextField>
              <TextField label="Dosagem" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} placeholder="1,0 mg" fullWidth />
            </Stack>
            <TextField select label="Fornecedor" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value as Supplier })}>
              <MenuItem value="botane">{supplierLabels.botane}</MenuItem>
              <MenuItem value="partner">{supplierLabels.partner}</MenuItem>
            </TextField>
            <TextField label="Ref. externa" value={form.externalRef} onChange={(e) => setForm({ ...form, externalRef: e.target.value })} placeholder="BOT-F-020" helperText="Vínculo com a origem (Botane/parceiro)." />
            <TextField label="Elegibilidade" value={form.eligibilityNotes} onChange={(e) => setForm({ ...form, eligibilityNotes: e.target.value })} multiline rows={3} placeholder="Critérios por perfil da anamnese" />
            <FormControlLabel
              control={<Switch checked={form.isGlp1} onChange={(e) => setForm({ ...form, isGlp1: e.target.checked })} />}
              label={<Typography variant="body2">GLP-1 <Typography component="span" variant="caption" color="text.secondary">(ponte clínica/comercial)</Typography></Typography>}
            />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Box>{editing && <Button color="error" onClick={handleDeleteFormula} disabled={busy}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>}</Box>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveFormula} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
