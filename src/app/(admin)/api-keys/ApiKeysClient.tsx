"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import { createKey, revokeKey, rotateKey } from "./actions";
import type { ApiKey } from "@/lib/api-keys/queries";

function formatDateTime(iso: string | null) {
  if (!iso) return "Nunca";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

function StatusDot({ status }: { status: ApiKey["status"] }) {
  const active = status === "active";
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: active ? "#22C55E" : "#94A3B8" }} />
      <Typography variant="body2">{active ? "Ativa" : "Revogada"}</Typography>
    </Box>
  );
}

const ENDPOINTS = [
  { path: "/api/storefront/catalog", desc: "Jornadas, planos e produtos publicados" },
  { path: "/api/storefront/protocols", desc: "Protocolos e fórmulas publicados" },
  { path: "/api/storefront/anamnesis", desc: "Formulários de anamnese publicados" },
];

export default function ApiKeysClient({ apiKeys }: { apiKeys: ApiKey[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [revealKey, setRevealKey] = useState<string | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuKey, setMenuKey] = useState<ApiKey | null>(null);

  const columns: Column<ApiKey>[] = [
    { id: "name", label: "Nome", sortable: true, sortAccessor: (k) => k.name, render: (k) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{k.name}</Typography> },
    { id: "prefix", label: "Chave", render: (k) => <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{k.keyPrefix}…</Typography> },
    { id: "scope", label: "Escopo", render: () => <Typography variant="body2" color="text.secondary">Leitura</Typography> },
    { id: "status", label: "Status", sortable: true, sortAccessor: (k) => k.status, render: (k) => <StatusDot status={k.status} /> },
    { id: "lastUsed", label: "Último uso", sortable: true, sortAccessor: (k) => (k.lastUsedAt ? new Date(k.lastUsedAt).getTime() : 0), render: (k) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDateTime(k.lastUsedAt)}</Typography> },
    {
      id: "actions", label: "", align: "right", render: (k) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuKey(k); }}>
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  async function handleCreate() {
    setError(null);
    if (!name.trim()) { setError("Dê um nome para a chave."); return; }
    setBusy(true);
    const result = await createKey(name);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setCreateOpen(false);
    setName("");
    if (result.raw) setRevealKey(result.raw);
    router.refresh();
  }

  async function handleRotate() {
    if (!menuKey) return;
    const target = menuKey;
    setMenuAnchor(null);
    setBusy(true);
    const result = await rotateKey(target.id);
    setBusy(false);
    if (result.ok && result.raw) setRevealKey(result.raw);
    router.refresh();
  }

  async function handleRevoke() {
    if (!menuKey) return;
    const target = menuKey;
    setMenuAnchor(null);
    setBusy(true);
    await revokeKey(target.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Chaves de API</Typography>
          <Typography variant="body1" color="text.secondary">
            Chaves de leitura para o front consumir o catálogo publicado (Storefront API).
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setName(""); setError(null); setCreateOpen(true); }}>
          Nova chave
        </Button>
      </Stack>

      <Card sx={{ mb: 2.5 }}>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Endpoints da Storefront</Typography>
          <Stack spacing={1}>
            {ENDPOINTS.map((e) => (
              <Stack key={e.path} direction="row" spacing={1.5} alignItems="baseline">
                <Box component="span" sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: "var(--color-blue-50)", color: "primary.main", fontSize: 11, fontWeight: 600 }}>GET</Box>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>{e.path}</Typography>
                <Typography variant="caption" color="text.secondary">{e.desc}</Typography>
              </Stack>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            Autenticação: header <code>Authorization: Bearer &lt;chave&gt;</code>. Só registros publicados são servidos.
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          rows={apiKeys}
          getRowId={(k) => k.id}
          initialSort={{ columnId: "status", dir: "asc" }}
          minWidth={720}
          countLabel={["chave", "chaves"]}
          emptyMessage="Nenhuma chave ainda. Crie a primeira para o front."
        />
      </Card>

      {/* Menu de ações */}
      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={handleRotate} disabled={busy || menuKey?.status !== "active"}>Rotacionar</MenuItem>
        <MenuItem onClick={handleRevoke} disabled={busy || menuKey?.status !== "active"} sx={{ color: "error.main" }}>Revogar</MenuItem>
      </Menu>

      {/* Criar chave */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Nova chave</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} placeholder="Front — produção" autoFocus helperText="Identifica o uso desta chave." />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate} disabled={busy}>{busy ? "Gerando…" : "Gerar chave"}</Button>
        </DialogActions>
      </Dialog>

      {/* Revelar chave (uma vez) */}
      <Dialog open={Boolean(revealKey)} onClose={() => setRevealKey(null)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 600 }}>Chave gerada</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Copie agora — esta chave não será exibida novamente. Guardamos apenas o hash.
          </Alert>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "background.default", border: "1px solid", borderColor: "divider", fontFamily: "monospace", fontSize: 14, wordBreak: "break-all", userSelect: "all" }}>
            {revealKey}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="contained" onClick={() => setRevealKey(null)}>Copiei, fechar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
