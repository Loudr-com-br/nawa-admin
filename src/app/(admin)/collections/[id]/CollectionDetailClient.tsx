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
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Alert from "@mui/material/Alert";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import PublishStatusChip from "@/components/PublishStatusChip";
import {
  collectionVisibilityLabels,
  refTypeLabels,
  type CollectionDetail,
  type CollectionVisibility,
  type MemberOption,
} from "@/lib/collections/types";
import {
  saveCollection,
  setCollectionStatus,
  deleteCollection,
  addMember,
  removeMember,
} from "../actions";
import { useToast } from "@/components/ToastProvider";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

export default function CollectionDetailClient({
  collection,
  memberOptions,
  parents,
}: {
  collection: CollectionDetail;
  memberOptions: MemberOption[];
  parents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inColl = new Set(collection.members.map((m) => `${m.refType}:${m.refId}`));
  const available = memberOptions.filter((o) => !inColl.has(`${o.refType}:${o.refId}`));

  const [metaOpen, setMetaOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [meta, setMeta] = useState({
    name: collection.name, slug: collection.slug, description: collection.description,
    parentId: collection.parentId ?? "", visibility: collection.visibility as CollectionVisibility,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [memberKey, setMemberKey] = useState("");

  async function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string, after?: () => void) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (!r.ok) { toast.error(r.error ?? "Falha"); return; }
    toast.success(okMsg);
    after?.();
    router.refresh();
  }

  async function togglePublish() {
    const next = collection.status === "published" ? "draft" : "published";
    await run(() => setCollectionStatus(collection.id, next), next === "published" ? "Coleção publicada" : "Coleção despublicada");
  }

  function openMeta() {
    setMeta({ name: collection.name, slug: collection.slug, description: collection.description, parentId: collection.parentId ?? "", visibility: collection.visibility });
    setConfirmDelete(false); setError(null); setMetaOpen(true);
  }

  async function handleSaveMeta() {
    setError(null);
    if (!meta.name.trim() || !meta.slug.trim()) { setError("Preencha nome e slug."); return; }
    setBusy(true);
    const r = await saveCollection(collection.id, {
      name: meta.name, slug: meta.slug, description: meta.description,
      parentId: meta.parentId || null, visibility: meta.visibility, status: collection.status,
    });
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setMetaOpen(false); toast.success("Coleção atualizada"); router.refresh();
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setBusy(true);
    const r = await deleteCollection(collection.id);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    toast.success("Coleção excluída"); router.push("/collections");
  }

  async function handleAddMember() {
    setError(null);
    if (!memberKey) { setError("Escolha um item ou protocolo."); return; }
    const [refType, refId] = memberKey.split(":");
    setBusy(true);
    const r = await addMember(collection.id, refType as "item" | "protocol", refId);
    setBusy(false);
    if (!r.ok) { setError(r.error); return; }
    setAddOpen(false); setMemberKey("");
    toast.success("Membro adicionado"); router.refresh();
  }

  return (
    <Box sx={{ maxWidth: 1160 }}>
      <Button component={Link} href="/collections" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Coleções
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h4" component="h1">{collection.name}</Typography>
            <Chip label={collectionVisibilityLabels[collection.visibility]} size="small" variant="outlined" />
            <PublishStatusChip status={collection.status} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {collection.parentName ? `Subcoleção de ${collection.parentName}` : "Coleção de topo"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<EditRoundedIcon />} onClick={openMeta} disabled={busy}>Editar</Button>
          <Button variant={collection.status === "published" ? "outlined" : "contained"} onClick={togglePublish} disabled={busy}>
            {collection.status === "published" ? "Despublicar" : "Publicar"}
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            <SectionCard
              title="Membros"
              icon={FolderRoundedIcon}
              action={<Button size="small" startIcon={<AddRoundedIcon />} onClick={() => { setMemberKey(""); setError(null); setAddOpen(true); }} disabled={available.length === 0}>Adicionar</Button>}
            >
              {collection.members.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                  Nenhum membro direto. Adicione itens e protocolos do catálogo.
                </Typography>
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500 } }}>
                      <TableCell>Membro</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collection.members.map((m) => (
                      <TableRow key={m.id} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{m.name}</Typography></TableCell>
                        <TableCell><Chip label={refTypeLabels[m.refType]} size="small" variant="outlined" /></TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => run(() => removeMember(m.id, collection.id), "Membro removido")} disabled={busy}>
                            <CloseRoundedIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </SectionCard>

            {collection.rollupMembers.length > 0 && (
              <SectionCard title="Membros das subcoleções (rollup)" icon={FolderRoundedIcon}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ "& th": { color: "text.secondary", fontWeight: 500 } }}>
                      <TableCell>Membro</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Vem de</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {collection.rollupMembers.map((m) => (
                      <TableRow key={m.id} sx={{ "&:last-child td": { border: 0 } }}>
                        <TableCell><Typography variant="body2">{m.name}</Typography></TableCell>
                        <TableCell><Chip label={refTypeLabels[m.refType]} size="small" variant="outlined" /></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{m.fromChild}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Herdados das subcoleções na leitura — não duplicam linha aqui.
                </Typography>
              </SectionCard>
            )}
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <SectionCard title="Coleção" icon={FolderRoundedIcon}>
            <DefRow label="Pai">
              <Typography variant="body2">{collection.parentName ?? "—"}</Typography>
            </DefRow>
            <DefRow label="Visibilidade">
              <Typography variant="body2">{collectionVisibilityLabels[collection.visibility]}</Typography>
            </DefRow>
            <DefRow label="Membros próprios"><Typography variant="body2">{collection.ownCount}</Typography></DefRow>
            <DefRow label="Com filhos (rollup)"><Typography variant="body2">{collection.rollupCount}</Typography></DefRow>
            <DefRow label="Slug"><Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{collection.slug}</Typography></DefRow>
            <DefRow label="Criado"><Typography variant="body2" color="text.secondary">{formatDate(collection.createdAt)}</Typography></DefRow>
          </SectionCard>
        </Grid>
      </Grid>

      {/* Editar meta */}
      <Dialog open={metaOpen} onClose={() => setMetaOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar coleção</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} autoFocus />
            <TextField label="Slug" value={meta.slug} onChange={(e) => setMeta({ ...meta, slug: e.target.value })} />
            <TextField label="Descrição" value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} multiline rows={2} />
            <TextField select label="Coleção-pai" value={meta.parentId} onChange={(e) => setMeta({ ...meta, parentId: e.target.value })} helperText="Vazio = coleção de topo.">
              <MenuItem value="">Nenhuma (topo)</MenuItem>
              {parents.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            <TextField select label="Visibilidade" value={meta.visibility} onChange={(e) => setMeta({ ...meta, visibility: e.target.value as CollectionVisibility })}>
              {(["public", "internal"] as CollectionVisibility[]).map((v) => <MenuItem key={v} value={v}>{collectionVisibilityLabels[v]}</MenuItem>)}
            </TextField>
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

      {/* Adicionar membro */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Adicionar membro</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField select label="Item ou protocolo" value={memberKey} onChange={(e) => setMemberKey(e.target.value)}>
              {available.length === 0
                ? <MenuItem value="" disabled>Tudo já está na coleção</MenuItem>
                : available.map((o) => (
                    <MenuItem key={`${o.refType}:${o.refId}`} value={`${o.refType}:${o.refId}`}>
                      {o.name} · {refTypeLabels[o.refType]}
                    </MenuItem>
                  ))}
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddMember} disabled={busy}>{busy ? "Adicionando…" : "Adicionar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
