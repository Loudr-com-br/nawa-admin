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
import FolderRoundedIcon from "@mui/icons-material/FolderRounded";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import PublishStatusChip from "@/components/PublishStatusChip";
import { collectionVisibilityLabels, type CollectionNode } from "@/lib/collections/types";
import { createCollection } from "./actions";
import { useToast } from "@/components/ToastProvider";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function flatten(nodes: CollectionNode[]): CollectionNode[] {
  const out: CollectionNode[] = [];
  const walk = (n: CollectionNode) => { out.push(n); n.children.forEach(walk); };
  nodes.forEach(walk);
  return out;
}

export default function CollectionsClient({
  tree, parents,
}: {
  tree: CollectionNode[];
  parents: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const rows = flatten(tree);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", parentId: "" });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setForm({ name: "", slug: "", description: "", parentId: "" });
    setError(null);
    setOpen(true);
  }

  async function handleSave() {
    setError(null);
    if (!form.name.trim() || !form.slug.trim()) { setError("Preencha nome e slug."); return; }
    setSaving(true);
    const r = await createCollection({
      name: form.name, slug: form.slug, description: form.description,
      parentId: form.parentId || null,
    });
    setSaving(false);
    if (!r.ok) { setError(r.error); return; }
    setOpen(false);
    toast.success("Coleção criada");
    if (r.id) router.push(`/collections/${r.id}`);
    else router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Coleções</Typography>
          <Typography variant="body1" color="text.secondary">
            Categorização mercadológica — agrupa itens e protocolos, plana ou em árvore.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          Nova coleção
        </Button>
      </Stack>

      <Card>
        {rows.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">Nenhuma coleção ainda. Crie a primeira.</Typography>
          </Box>
        ) : (
          <Box>
            {rows.map((c, idx) => (
              <Stack
                key={c.id}
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => router.push(`/collections/${c.id}`)}
                sx={{
                  px: 2, py: 1.5, cursor: "pointer",
                  borderTop: idx === 0 ? "none" : "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Box sx={{ pl: c.depth * 3, display: "flex", alignItems: "center", gap: 0.75, minWidth: 0, flex: 1 }}>
                  {c.depth > 0
                    ? <SubdirectoryArrowRightRoundedIcon fontSize="small" sx={{ color: "text.disabled" }} />
                    : <FolderRoundedIcon fontSize="small" sx={{ color: "text.secondary" }} />}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{c.name}</Typography>
                    {c.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block", maxWidth: 420 }}>{c.description}</Typography>
                    )}
                  </Box>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                  {c.ownCount} próprio{c.ownCount === 1 ? "" : "s"}
                  {c.rollupCount !== c.ownCount && ` · ${c.rollupCount} c/ filhos`}
                </Typography>
                <Chip label={collectionVisibilityLabels[c.visibility]} size="small" variant="outlined" />
                <PublishStatusChip status={c.status} />
              </Stack>
            ))}
          </Box>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Nova coleção</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: f.slug || slugify(e.target.value) }))} placeholder="Metabolic Reset" autoFocus />
            <TextField label="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="metabolic-reset" helperText="Identificador único." />
            <TextField label="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} multiline rows={2} />
            <TextField select label="Coleção-pai" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })} helperText="Deixe vazio para coleção de topo.">
              <MenuItem value="">Nenhuma (topo)</MenuItem>
              {parents.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </TextField>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} color="inherit" disabled={saving}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? "Criando…" : "Criar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
