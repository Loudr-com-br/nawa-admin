import { notFound } from "next/navigation";
import Link from "next/link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Avatar from "@mui/material/Avatar";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import HealthAndSafetyRoundedIcon from "@mui/icons-material/HealthAndSafetyRounded";
import { getPatientById } from "@/lib/patients/queries";
import { consentLabels } from "@/lib/patients/types";
import { SectionCard, DefRow } from "@/components/orders/DetailPrimitives";
import { OrderStatusChip } from "@/components/orders/StatusChip";
import SubscriptionStatusChip from "@/components/SubscriptionStatusChip";
import { formatBRL, formatDate } from "@/lib/orders/format";

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const patient = await getPatientById(id);
  if (!patient) notFound();

  return (
    <Box sx={{ maxWidth: 1160 }}>
      <Button component={Link} href="/patients" startIcon={<ArrowBackRoundedIcon />} sx={{ mb: 2, color: "text.secondary" }} size="small">
        Pacientes
      </Button>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Avatar sx={{ width: 48, height: 48, bgcolor: "var(--color-blue-50)", color: "primary.main", fontWeight: 600 }}>
          {initials(patient.name)}
        </Avatar>
        <Box>
          <Typography variant="h4" component="h1">{patient.name}</Typography>
          <Typography variant="body2" color="text.secondary">{patient.email}</Typography>
        </Box>
      </Stack>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2.5}>
            {/* Assinaturas */}
            <SectionCard title="Assinaturas" icon={AutorenewRoundedIcon}>
              {patient.subscriptions.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Sem assinaturas.</Typography>
              ) : (
                <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
                  {patient.subscriptions.map((s) => (
                    <Stack key={s.id} direction="row" alignItems="center" spacing={1} sx={{ py: 1.25 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Plano {s.planName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.currentPeriodStart && s.currentPeriodEnd ? `${formatDate(s.currentPeriodStart)} – ${formatDate(s.currentPeriodEnd)}` : "—"}
                        </Typography>
                      </Box>
                      <SubscriptionStatusChip status={s.status} />
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>

            {/* Pedidos */}
            <SectionCard title="Histórico de pedidos" icon={ReceiptLongRoundedIcon}>
              {patient.orders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Nenhum pedido.</Typography>
              ) : (
                <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
                  {patient.orders.map((o) => (
                    <Stack
                      key={o.id}
                      component={Link}
                      href={`/orders/${o.id}`}
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{ py: 1.25, textDecoration: "none", color: "inherit", "&:hover": { color: "primary.main" } }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 110 }}>{o.number}</Typography>
                      <Box sx={{ flex: 1 }}><OrderStatusChip status={o.status} /></Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatBRL(o.total)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 96, textAlign: "right" }}>{formatDate(o.createdAt)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </SectionCard>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            <SectionCard title="Cadastro" icon={PersonRoundedIcon}>
              <DefRow label="E-mail"><Typography variant="body2">{patient.email}</Typography></DefRow>
              <DefRow label="Telefone"><Typography variant="body2">{patient.phone || "—"}</Typography></DefRow>
              <DefRow label="Consentimento">
                <Chip label={consentLabels[patient.consentStatus] ?? patient.consentStatus} size="small" variant="outlined" />
              </DefRow>
              <DefRow label="Paciente desde"><Typography variant="body2">{formatDate(patient.createdAt)}</Typography></DefRow>
            </SectionCard>

            <SectionCard title="Status clínico" icon={HealthAndSafetyRoundedIcon}>
              <Typography variant="body2" color="text.secondary">
                {Object.keys(patient.clinicalProfile).length === 0
                  ? "Sem perfil clínico registrado. Preenchido a partir da anamnese respondida (§5.7)."
                  : JSON.stringify(patient.clinicalProfile)}
              </Typography>
              <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1.5 }}>
                Dado sensível — acesso restrito por papel e sob auditoria (§7/§8).
              </Typography>
            </SectionCard>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
