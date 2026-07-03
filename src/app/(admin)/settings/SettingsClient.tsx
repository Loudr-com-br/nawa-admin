"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
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
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import { roleLabels, type AppRole } from "@/lib/supabase/roles";
import type { InternalUser } from "@/lib/users/queries";
import { inviteUser, setUserRole, setUserStatus } from "./actions";
import { useToast } from "@/components/ToastProvider";

const roles: AppRole[] = ["super_admin", "catalog_admin", "doctor", "operator"];

function StatusDot({ status }: { status: string }) {
  const active = status === "active";
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: active ? "#22C55E" : "#94A3B8" }} />
      <Typography variant="body2">{active ? "Ativo" : "Inativo"}</Typography>
    </Box>
  );
}

const INTEGRATIONS = [
  { name: "Pagar.me", desc: "Pagamentos e recorrência", env: "PAGARME_API_KEY" },
  { name: "eNotas", desc: "Emissão de nota fiscal", env: "ENOTAS_API_KEY" },
  { name: "Hubspot", desc: "CRM e notificações", env: "HUBSPOT_API_KEY" },
  { name: "Botane", desc: "Catálogo clínico (origem)", env: "BOTANE_API_KEY" },
];

export default function SettingsClient({ users, currentEmail }: { users: InternalUser[]; currentEmail: string }) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "operator" as AppRole });

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<InternalUser | null>(null);
  const [editForm, setEditForm] = useState({ role: "operator" as AppRole, active: true });

  const isSelf = (u: InternalUser) => u.email.toLowerCase() === currentEmail.toLowerCase();

  const columns: Column<InternalUser>[] = [
    {
      id: "email", label: "Usuário", sortable: true, sortAccessor: (u) => u.email,
      render: (u) => (
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, bgcolor: "var(--color-blue-50)", color: "primary.main" }}>
            {u.email.slice(0, 2).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>{u.email}{isSelf(u) && <Typography component="span" variant="caption" color="text.secondary"> (você)</Typography>}</Typography>
        </Stack>
      ),
    },
    { id: "role", label: "Papel", sortable: true, sortAccessor: (u) => u.role, render: (u) => <Chip label={roleLabels[u.role]} size="small" variant="outlined" /> },
    { id: "mfa", label: "MFA", render: (u) => <Typography variant="body2" color="text.secondary">{u.mfaEnabled ? "Ativado" : "—"}</Typography> },
    { id: "status", label: "Status", sortable: true, sortAccessor: (u) => u.status, render: (u) => <StatusDot status={u.status} /> },
  ];

  async function handleInvite() {
    setError(null);
    if (!inviteForm.email.trim()) { setError("Informe um e-mail."); return; }
    setBusy(true);
    const result = await inviteUser(inviteForm.email, inviteForm.role);
    setBusy(false);
    if (!result.ok) { setError(result.error); return; }
    setInviteOpen(false);
    setInviteForm({ email: "", role: "operator" });
    toast.success("Usuário convidado");
    router.refresh();
  }

  function openEdit(u: InternalUser) {
    if (isSelf(u)) return; // não editar o próprio acesso
    setEditing(u);
    setEditForm({ role: u.role, active: u.status === "active" });
    setError(null);
    setEditOpen(true);
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setBusy(true);
    setError(null);
    if (editForm.role !== editing.role) {
      const r = await setUserRole(editing.id, editForm.role);
      if (!r.ok) { setBusy(false); setError(r.error); return; }
    }
    const newStatus = editForm.active ? "active" : "inactive";
    if (newStatus !== editing.status) {
      const r = await setUserStatus(editing.id, newStatus);
      if (!r.ok) { setBusy(false); setError(r.error); return; }
    }
    setBusy(false);
    setEditOpen(false);
    toast.success("Usuário atualizado");
    router.refresh();
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Configuração</Typography>
          <Typography variant="body1" color="text.secondary">Usuários internos, papéis e integrações.</Typography>
        </Box>
        {tab === 0 && (
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => { setInviteForm({ email: "", role: "operator" }); setError(null); setInviteOpen(true); }}>
            Convidar usuário
          </Button>
        )}
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Usuários" />
        <Tab label="Integrações" />
      </Tabs>

      {tab === 0 && (
        <Card>
          <DataTable
            columns={columns}
            rows={users}
            getRowId={(u) => u.id}
            onRowClick={openEdit}
            initialSort={{ columnId: "email", dir: "asc" }}
            minWidth={640}
            countLabel={["usuário", "usuários"]}
            emptyMessage="Nenhum usuário interno."
          />
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Integrações configuradas por variáveis de ambiente server-side (§8.4). Segredos nunca no cliente.
            </Typography>
            <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
              {INTEGRATIONS.map((i) => (
                <Stack key={i.name} direction="row" alignItems="center" spacing={2} sx={{ py: 1.5 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{i.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{i.desc} · <Box component="code">{i.env}</Box></Typography>
                  </Box>
                  <Chip label="Não configurado" size="small" variant="outlined" />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Convidar */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Convidar usuário</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <TextField label="E-mail" type="email" value={inviteForm.email} onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })} placeholder="medico@nawahealth.com" autoFocus />
            <TextField select label="Papel" value={inviteForm.role} onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as AppRole })}>
              {roles.map((r) => <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary">
              O usuário define a senha no primeiro acesso via &quot;Esqueci a senha&quot;.
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleInvite} disabled={busy}>{busy ? "Convidando…" : "Convidar"}</Button>
        </DialogActions>
      </Dialog>

      {/* Editar */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Editar usuário</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">{editing?.email}</Typography>
            <TextField select label="Papel" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value as AppRole })}>
              {roles.map((r) => <MenuItem key={r} value={r}>{roleLabels[r]}</MenuItem>)}
            </TextField>
            <FormControlLabel control={<Switch checked={editForm.active} onChange={(e) => setEditForm({ ...editForm, active: e.target.checked })} />} label={<Typography variant="body2">Ativo</Typography>} />
            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
