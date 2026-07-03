"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { DataTable, type Column } from "@/components/table/DataTable";
import { consentLabels, type Patient } from "@/lib/patients/types";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}
function formatDate(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

const columns: Column<Patient>[] = [
  {
    id: "name", label: "Paciente", sortable: true, sortAccessor: (p) => p.name,
    render: (p) => (
      <Stack direction="row" spacing={1.25} alignItems="center">
        <Avatar sx={{ width: 30, height: 30, fontSize: 12, fontWeight: 600, bgcolor: "var(--color-blue-50)", color: "primary.main" }}>{initials(p.name)}</Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap>{p.name}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{p.email}</Typography>
        </Box>
      </Stack>
    ),
  },
  { id: "phone", label: "Telefone", render: (p) => <Typography variant="body2" color="text.secondary">{p.phone || "—"}</Typography> },
  { id: "consent", label: "Consentimento", sortable: true, sortAccessor: (p) => p.consentStatus, render: (p) => <Typography variant="body2" color="text.secondary">{consentLabels[p.consentStatus] ?? p.consentStatus}</Typography> },
  { id: "createdAt", label: "Desde", sortable: true, sortAccessor: (p) => new Date(p.createdAt).getTime(), render: (p) => <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</Typography> },
];

export default function PatientsClient({ patients }: { patients: Patient[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }, [patients, search]);

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Pacientes</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        O paciente como pessoa: cadastro, assinaturas, pedidos e status clínico num só lugar.
      </Typography>

      <Card>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <TextField
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
            sx={{ maxWidth: 360 }}
            fullWidth
          />
        </Box>
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(p) => p.id}
          onRowClick={(p) => router.push(`/patients/${p.id}`)}
          initialSort={{ columnId: "name", dir: "asc" }}
          minWidth={720}
          countLabel={["paciente", "pacientes"]}
          emptyMessage="Nenhum paciente encontrado."
        />
      </Card>
    </Box>
  );
}
