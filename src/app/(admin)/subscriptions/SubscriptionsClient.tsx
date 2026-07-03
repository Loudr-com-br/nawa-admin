"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import SubscriptionStatusChip from "@/components/SubscriptionStatusChip";
import { useToast } from "@/components/ToastProvider";
import { formatDate } from "@/lib/orders/format";
import {
  subStatusConfig,
  subStatusOrder,
  type Subscription,
  type SubscriptionStatus,
} from "@/lib/subscriptions/types";
import { setSubscriptionStatus, changeSubscriptionPlan } from "./actions";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default function SubscriptionsClient({
  subscriptions,
  planOptions,
}: {
  subscriptions: Subscription[];
  planOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | "all">("all");
  const toast = useToast();
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuSub, setMenuSub] = useState<Subscription | null>(null);
  const [busy, setBusy] = useState(false);

  const [planOpen, setPlanOpen] = useState(false);
  const [planId, setPlanId] = useState("");

  const filtered = useMemo(
    () => subscriptions.filter((s) => status === "all" || s.status === status),
    [subscriptions, status]
  );

  async function apply(fn: () => Promise<{ ok: boolean; error?: string }>, successMsg: string) {
    setMenuAnchor(null);
    setBusy(true);
    const result = await fn();
    setBusy(false);
    if (result.ok) toast.success(successMsg);
    else toast.error(result.error ?? "Não foi possível concluir.");
    router.refresh();
  }

  const columns: Column<Subscription>[] = [
    {
      id: "patient", label: "Paciente", sortable: true, sortAccessor: (s) => s.patientName,
      render: (s) => (
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, bgcolor: "var(--color-blue-50)", color: "primary.main" }}>{initials(s.patientName)}</Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{s.patientName}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap>{s.patientEmail}</Typography>
          </Box>
        </Stack>
      ),
    },
    { id: "plan", label: "Plano", sortable: true, sortAccessor: (s) => s.planName, render: (s) => <Typography variant="body2">{s.planName}</Typography> },
    { id: "status", label: "Status", sortable: true, sortAccessor: (s) => subStatusOrder.indexOf(s.status), render: (s) => <SubscriptionStatusChip status={s.status} /> },
    {
      id: "period", label: "Período atual", render: (s) => (
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
          {s.currentPeriodStart && s.currentPeriodEnd ? `${formatDate(s.currentPeriodStart)} – ${formatDate(s.currentPeriodEnd)}` : "—"}
        </Typography>
      ),
    },
    { id: "ref", label: "Pagar.me", render: (s) => <Typography variant="body2" sx={{ fontFamily: "monospace" }} color="text.secondary">{s.paymentProviderRef ?? "—"}</Typography> },
    {
      id: "actions", label: "", align: "right", render: (s) => (
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); setMenuAnchor(e.currentTarget); setMenuSub(s); }}>
          <MoreVertRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  const s = menuSub;

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Assinaturas</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Operação da recorrência: pausa, reativação, cancelamento e troca de plano.
      </Typography>

      <Card>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value as SubscriptionStatus | "all")} sx={{ minWidth: 200 }}>
            <MenuItem value="all">Todos os status</MenuItem>
            {subStatusOrder.map((st) => <MenuItem key={st} value={st}>{subStatusConfig[st].label}</MenuItem>)}
          </TextField>
        </Box>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(x) => x.id}
          initialSort={{ columnId: "status", dir: "asc" }}
          minWidth={860}
          countLabel={["assinatura", "assinaturas"]}
          emptyMessage="Nenhuma assinatura com esse filtro."
        />
      </Card>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {s && s.status === "active" && (
          <MenuItem disabled={busy} onClick={() => apply(() => setSubscriptionStatus(s.id, "paused"), "Assinatura pausada")}>Pausar</MenuItem>
        )}
        {s && (s.status === "paused" || s.status === "past_due" || s.status === "canceled") && (
          <MenuItem disabled={busy} onClick={() => apply(() => setSubscriptionStatus(s.id, "active"), s.status === "past_due" ? "Cobrança retentada" : "Assinatura reativada")}>
            {s.status === "past_due" ? "Retentar cobrança" : "Reativar"}
          </MenuItem>
        )}
        {s && (
          <MenuItem disabled={busy} onClick={() => { setPlanId(s.planId); setMenuAnchor(null); setPlanOpen(true); }}>Mudar plano</MenuItem>
        )}
        {s && s.status !== "canceled" && (
          <MenuItem disabled={busy} sx={{ color: "error.main" }} onClick={() => apply(() => setSubscriptionStatus(s.id, "canceled"), "Assinatura cancelada")}>Cancelar</MenuItem>
        )}
      </Menu>

      <Dialog open={planOpen} onClose={() => setPlanOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 600 }}>Mudar plano</DialogTitle>
        <DialogContent>
          <TextField select label="Plano" value={planId} onChange={(e) => setPlanId(e.target.value)} fullWidth sx={{ mt: 0.5 }}>
            {planOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPlanOpen(false)} color="inherit" disabled={busy}>Cancelar</Button>
          <Button variant="contained" disabled={busy || !planId || !s} onClick={() => { const sub = s; setPlanOpen(false); if (sub) apply(() => changeSubscriptionPlan(sub.id, planId), "Plano alterado"); }}>Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
