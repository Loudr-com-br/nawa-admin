"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { DataTable, type Column } from "@/components/table/DataTable";
import { actionLabels, type AuditEntry } from "@/lib/audit/types";

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date(iso));
}

function summarize(changes: Record<string, unknown>): string {
  const keys = Object.keys(changes);
  if (keys.length === 0) return "—";
  return keys.map((k) => `${k}: ${String(changes[k])}`).join(" · ");
}

const columns: Column<AuditEntry>[] = [
  { id: "createdAt", label: "Quando", sortable: true, sortAccessor: (e) => new Date(e.createdAt).getTime(), render: (e) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDateTime(e.createdAt)}</Typography> },
  { id: "actor", label: "Quem", sortable: true, sortAccessor: (e) => e.actorEmail, render: (e) => <Typography variant="body2" sx={{ fontWeight: 500 }}>{e.actorEmail}</Typography> },
  { id: "action", label: "Ação", sortable: true, sortAccessor: (e) => e.action, render: (e) => <Chip label={actionLabels[e.action] ?? e.action} size="small" variant="outlined" /> },
  { id: "entity", label: "Entidade", render: (e) => <Typography variant="body2" color="text.secondary">{e.entityType ?? "—"}{e.entityId ? ` · ${String(e.entityId).slice(0, 8)}` : ""}</Typography> },
  { id: "changes", label: "Detalhes", render: (e) => <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>{summarize(e.changes)}</Typography> },
  { id: "ip", label: "IP", render: (e) => <Typography variant="body2" color="text.disabled">{e.ip ?? "—"}</Typography> },
];

export default function AuditClient({ entries }: { entries: AuditEntry[] }) {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Auditoria & LGPD</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Trilha imutável de ações sensíveis: ator, ação, entidade, mudança, IP e horário (§8.3).
      </Typography>

      <Card>
        <DataTable
          columns={columns}
          rows={entries}
          getRowId={(e) => e.id}
          initialSort={{ columnId: "createdAt", dir: "desc" }}
          minWidth={900}
          countLabel={["registro", "registros"]}
          emptyMessage="Sem registros de auditoria ainda."
        />
      </Card>
    </Box>
  );
}
