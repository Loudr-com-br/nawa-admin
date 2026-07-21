"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
import InputAdornment from "@mui/material/InputAdornment";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import GppMaybeRoundedIcon from "@mui/icons-material/GppMaybeRounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import PublishStatusChip from "@/components/PublishStatusChip";
import Glp1Tag from "@/components/orders/Glp1Tag";
import { MedicalOnlyChip } from "@/components/VisibilityChip";
import {
  formatBRL,
  itemTypeLabels,
  visibilityLabels,
  type Item,
  type Visibility,
} from "@/lib/catalog/types";
import {
  claimStatusLabels,
  claimStatusColor,
  priceSourceLabels,
  hasDrift,
  priceDrift,
  type ProtocolDetail,
  type ProtocolMember,
  type ClaimStatus,
} from "@/lib/protocols/types";
import {
  saveProtocolMeta,
  setProtocolStatus,
  addProtocolItem,
  updateMemberQuantity,
  removeProtocolItem,
  recalcPrice,
  setPrice,
  saveClaims,
  setClaimStatus,
  deleteProtocol,
} from "../actions";
import { useToast } from "@/components/ToastProvider";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function ProtocolDetailClient({
  protocol,
  catalogItems,
}: {
  protocol: ProtocolDetail;
  catalogItems: Item[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const drift = priceDrift(protocol.price, protocol.itemsSum);
  const drifting = hasDrift(protocol.price, protocol.itemsSum);
  const anyMedicalMember = protocol.members.some((m) => m.visibility === "medical_only");
  const inKit = new Set(protocol.members.map((m) => m.itemId));
  const available = catalogItems.filter((i) => !inKit.has(i.id));

  // ── Diálogos ──
  const [metaOpen, setMetaOpen] = useState(false);
  const [meta, setMeta] = useState({
    name: protocol.name, slug: protocol.slug,
    clinicalDescription: protocol.clinicalDescription,
    pageContent: protocol.pageContent,
    visibility: protocol.visibility as Visibility,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ itemId: "", quantity: "1" });

  const [memberDlg, setMemberDlg] = useState<ProtocolMember | null>(null);
  const [memberQty, setMemberQty] = useState("1");

  const [priceOpen, setPriceOpen] = useState(false);
  const [priceVal, setPriceVal] = useState(String(protocol.price));

  const [claimsOpen, setClaimsOpen] = useState(false);
  const [claims, setClaims] = useState({ claimInternal: protocol.claimInternal, claimPublic: protocol.claimPublic });

  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) { toast.error(r.error ?? "Falha na operação"); return; }
    toast.success(okMsg);
    after?.();
    router.refresh();
  }

  // ── Handlers ──
  async function togglePublish() {
    const next = protocol.status === "published" ? "draft" : "published";
    await run(() => setProtocolStatus(protocol.id, next), next === "published" ? "Protocolo publicado" : "Protocolo despublicado");
  }

  async function handleSaveMeta() {
    setError(null);
    if (!meta.name.trim() || !meta.slug.trim()) { setError("Preencha nome e slug."); return; }
    setBusy(true);
    const r = await saveProtocolMeta(protocol.id, {
      name: meta.name, slug: meta.slug, clinicalDescription: meta.clinicalDescription,
      pageContent: meta.pageContent,
      visibility: anyMedicalMember ? "medical_only" : meta.visibility,
      status: protocol.status,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setMetaOpen(false); toast.success("Protocolo atualizado"); router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    const r = await deleteProtocol(protocol.id);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    toast.success("Protocolo excluído"); router.push("/protocols");
  }

  async function handleAddItem() {
    setError(null);
    if (!addForm.itemId) { setError("Escolha um item."); return; }
    setBusy(true);
    const r = await addProtocolItem(protocol.id, addForm.itemId, Number(addForm.quantity) || 1);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setAddOpen(false); setAddForm({ itemId: "", quantity: "1" });
    toast.success("Item adicionado"); router.refresh();
  }

  function openMember(m: ProtocolMember) {
    setMemberDlg(m); setMemberQty(String(m.quantity)); setError(null);
  }
  async function handleSaveMember() {
    if (!memberDlg) return;
    await run(() => updateMemberQuantity(memberDlg.id, protocol.id, Number(memberQty) || 1), "Quantidade atualizada", () => setMemberDlg(null));
  }
  async function handleRemoveMember() {
    if (!memberDlg) return;
    await run(() => removeProtocolItem(memberDlg.id, protocol.id), "Item removido", () => setMemberDlg(null));
  }

  async function handleRecalc() {
    await run(() => recalcPrice(protocol.id), "Preço recalculado pela soma");
  }
  async function handleSetPrice() {
    setError(null);
    await run(() => setPrice(protocol.id, Number(priceVal) || 0), "Preço definido", () => setPriceOpen(false));
  }

  async function handleSaveClaims() {
    await run(() => saveClaims(protocol.id, claims), "Claims salvos", () => setClaimsOpen(false));
  }
  async function handleClaimStatus(status: ClaimStatus) {
    await run(() => setClaimStatus(protocol.id, status), "Estado do claim atualizado");
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
            {protocol.visibility === "medical_only" && <MedicalOnlyChip />}
            <PublishStatusChip status={protocol.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {protocol.itemCount} {protocol.itemCount === 1 ? "item" : "itens"} · versão {protocol.version}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={() => { setMeta({ name: protocol.name, slug: protocol.slug, clinicalDescription: protocol.clinicalDescription, pageContent: protocol.pageContent, visibility: protocol.visibility }); setConfirmDelete(false); setError(null); setMetaOpen(true); }} disabled={busy}>Editar</Button>
          <Button variant={protocol.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
            {protocol.status === "published" ? "Despublicar" : "Publicar"}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard
              title="Itens do kit"
              icon={ScienceRoundedIcon}
              action={<Button size="small" startIcon={<AddRoundedIcon />} onClick={() => { setAddForm({ itemId: "", quantity: "1" }); setError(null); setAddOpen(true); }} disabled={available.length === 0}>Adicionar</Button>}
            >
              {protocol.members.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Nenhum item ainda. Um kit é a curadoria de itens do catálogo — adicione um ou mais.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500 } }}>
                      <TableCell>Item</TableCell>
                      <TableCell>Fornecedor</TableCell>
                      <TableCell align="center">Qtd.</TableCell>
                      <TableCell align="right">Preço un.</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {protocol.members.map((m) => (
                      <TableRow key={m.id} hover onClick={() => openMember(m)} sx={{ cursor: "pointer", "&:last-child td": { border: 0 } }}>
                        <TableCell>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.name}</Typography>
                            {m.isGlp1 && <Glp1Tag />}
                            {m.visibility === "medical_only" && <MedicalOnlyChip />}
                          </Stack>
                          <Typography variant="caption" color="text.secondary">{itemTypeLabels[m.itemType]}</Typography>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{m.supplierName}</Typography></TableCell>
                        <TableCell align="center"><Typography variant="body2">{m.quantity}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" color="text.secondary">{formatBRL(m.price)}</Typography></TableCell>
                        <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(m.price * m.quantity)}</Typography></TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ "& td": { borderTop: "1px solid", borderColor: "divider" } }}>
                      <TableCell colSpan={4}><Typography variant="body2" color="text.secondary">Soma dos itens</Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2" sx={{ fontWeight: 600 }}>{formatBRL(protocol.itemsSum)}</Typography></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            <SectionCard
              title="Claims"
              icon={GppMaybeRoundedIcon}
              action={<Button size="small" startIcon={<EditRoundedIcon />} onClick={() => { setClaims({ claimInternal: protocol.claimInternal, claimPublic: protocol.claimPublic }); setClaimsOpen(true); }}>Editar</Button>}
            >
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <Chip label={claimStatusLabels[protocol.claimStatus]} size="small" color={claimStatusColor[protocol.claimStatus]} />
                {protocol.claimStatus === "draft" && <Button size="small" onClick={() => handleClaimStatus("pending_review")} disabled={busy}>Enviar p/ revisão</Button>}
                {protocol.claimStatus === "pending_review" && (
                  <>
                    <Button size="small" color="success" onClick={() => handleClaimStatus("approved")} disabled={busy}>Aprovar</Button>
                    <Button size="small" color="error" onClick={() => handleClaimStatus("rejected")} disabled={busy}>Rejeitar</Button>
                  </>
                )}
                {protocol.claimStatus === "rejected" && <Button size="small" onClick={() => handleClaimStatus("pending_review")} disabled={busy}>Reenviar p/ revisão</Button>}
                {protocol.claimStatus === "approved" && <Typography variant="caption" color="text.secondary">Aprovado em {formatDate(protocol.claimReviewedAt)}</Typography>}
              </Stack>
              <DefRow label="Interno">
                <Typography variant="body2" color={protocol.claimInternal ? "text.primary" : "text.disabled"}>{protocol.claimInternal || "—"}</Typography>
              </DefRow>
              <DefRow label="Público">
                <Typography variant="body2" color={protocol.claimPublic ? "text.primary" : "text.disabled"}>{protocol.claimPublic || "—"}</Typography>
              </DefRow>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                O claim público só é servido ao front quando aprovado. Editar o texto derruba a aprovação.
              </Typography>
            </SectionCard>

            <SectionCard title="Página do kit" icon={ArticleRoundedIcon}>
              <Typography variant="body2" color={protocol.pageContent ? "text.primary" : "text.disabled"} sx={{ whiteSpace: "pre-wrap" }}>
                {protocol.pageContent || "Sem conteúdo editorial. Edite o protocolo para descrever o kit."}
              </Typography>
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <SectionCard
              title="Preço"
              icon={PaymentsRoundedIcon}
              action={<Button size="small" onClick={() => { setPriceVal(String(protocol.price)); setPriceOpen(true); }}>Definir</Button>}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>{formatBRL(protocol.price)}</Typography>
              <Chip label={priceSourceLabels[protocol.priceSource]} size="small" variant="outlined" sx={{ mb: 1.5 }} />
              <DefRow label="Soma dos itens">
                <Typography variant="body2">{formatBRL(protocol.itemsSum)}</Typography>
              </DefRow>
              {drifting && (
                <Alert severity="warning" sx={{ mt: 1.5 }} action={
                  protocol.priceSource === "sum"
                    ? <Button color="inherit" size="small" startIcon={<AutorenewRoundedIcon />} onClick={handleRecalc} disabled={busy}>Recalcular</Button>
                    : undefined
                }>
                  {drift > 0
                    ? `Kit ${formatBRL(drift)} abaixo da soma.`
                    : `Kit ${formatBRL(-drift)} acima da soma.`}
                  {protocol.priceSource === "manual" && " Preço manual — não recalcula sozinho."}
                </Alert>
              )}
            </SectionCard>

            <SectionCard title="Publicação" icon={ScienceRoundedIcon}>
              <DefRow label="Visibilidade">
                {protocol.visibility === "medical_only" ? <MedicalOnlyChip /> : <Typography variant="body2">Pública</Typography>}
              </DefRow>
              <DefRow label="Status"><PublishStatusChip status={protocol.status} /></DefRow>
              <DefRow label="Versão"><Typography variant="body2">{protocol.version}</Typography></DefRow>
              <DefRow label="Slug"><Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{protocol.slug}</Typography></DefRow>
              <DefRow label="Criado"><Typography variant="body2" color="text.secondary">{formatDate(protocol.createdAt)}</Typography></DefRow>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>

      {/* Editar meta */}
      <Dialog open={metaOpen} onClose={() => setMetaOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar protocolo</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} autoFocus />
            <TextField label="Slug" value={meta.slug} onChange={(e) => setMeta({ ...meta, slug: e.target.value })} />
            <TextField label="Descrição clínica" value={meta.clinicalDescription} onChange={(e) => setMeta({ ...meta, clinicalDescription: e.target.value })} multiline rows={2} />
            <TextField select label="Visibilidade" value={anyMedicalMember ? "medical_only" : meta.visibility}
              onChange={(e) => setMeta({ ...meta, visibility: e.target.value as Visibility })}
              disabled={anyMedicalMember}
              helperText={anyMedicalMember ? "Contém item só-médico → o kit é só-médico." : "Pública aparece na vitrine."}>
              {(["public", "medical_only"] as Visibility[]).map((v) => <MenuItem key={v} value={v}>{visibilityLabels[v]}</MenuItem>)}
            </TextField>
            <TextField label="Página do kit" value={meta.pageContent} onChange={(e) => setMeta({ ...meta, pageContent: e.target.value })} multiline rows={4} placeholder="Conteúdo editorial: como o kit é, para quem, o que entrega." helperText="Aparece na página do produto." />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="error" onClick={handleDelete} disabled={busy}>{confirmDelete ? "Confirmar exclusão" : "Excluir"}</Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setMetaOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveMeta} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Adicionar item */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Adicionar item</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField select label="Item do catálogo" value={addForm.itemId} onChange={(e) => setAddForm({ ...addForm, itemId: e.target.value })}>
              {available.length === 0
                ? <MenuItem value="" disabled>Todos os itens já estão no kit</MenuItem>
                : available.map((i) => (
                    <MenuItem key={i.id} value={i.id}>{i.name} — {formatBRL(i.price)}{i.visibility === "medical_only" ? " · só-médico" : ""}</MenuItem>
                  ))}
            </TextField>
            <TextField label="Quantidade" type="number" value={addForm.quantity} onChange={(e) => setAddForm({ ...addForm, quantity: e.target.value })} slotProps={{ htmlInput: { min: 1 } }} />
            <Typography variant="caption" color="text.secondary">Adicionar item não recalcula o preço do kit — use “Recalcular” quando quiser.</Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddItem} disabled={busy}>{busy ? "Adicionando…" : "Adicionar"}</Button>
        </DialogActions>
      </Dialog>

      {/* Editar item do kit */}
      <Dialog open={!!memberDlg} onClose={() => setMemberDlg(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>{memberDlg?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Quantidade" type="number" value={memberQty} onChange={(e) => setMemberQty(e.target.value)} slotProps={{ htmlInput: { min: 1 } }} autoFocus />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, justifyContent: "space-between" }}>
          <Button color="error" onClick={handleRemoveMember} disabled={busy}>Remover do kit</Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={() => setMemberDlg(null)} color="inherit" disabled={busy}>Cancelar</Button>
            <Button variant="contained" onClick={handleSaveMember} disabled={busy}>Salvar</Button>
          </Stack>
        </DialogActions>
      </Dialog>

      {/* Definir preço */}
      <Dialog open={priceOpen} onClose={() => setPriceOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Definir preço</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Preço" type="number" value={priceVal} onChange={(e) => setPriceVal(e.target.value)}
              slotProps={{ input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} autoFocus />
            <Typography variant="caption" color="text.secondary">Definir manualmente marca a origem como “Manual” — não recalcula sozinho depois.</Typography>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPriceOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleSetPrice} disabled={busy}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* Editar claims */}
      <Dialog open={claimsOpen} onClose={() => setClaimsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar claims</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Claim interno" value={claims.claimInternal} onChange={(e) => setClaims({ ...claims, claimInternal: e.target.value })} multiline rows={2} helperText="Uso interno — não vai ao paciente." />
            <TextField label="Claim público" value={claims.claimPublic} onChange={(e) => setClaims({ ...claims, claimPublic: e.target.value })} multiline rows={2} helperText="Só é servido quando aprovado. Editar derruba a aprovação." />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setClaimsOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveClaims} disabled={busy}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
