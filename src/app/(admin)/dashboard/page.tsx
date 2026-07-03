import Link from "next/link";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { getDashboardMetrics } from "@/lib/dashboard/queries";
import { formatBRL, formatDate } from "@/lib/orders/format";
import { OrderStatusChip } from "@/components/orders/StatusChip";

function MetricCard({ icon: Icon, value, label, hint }: { icon: SvgIconComponent; value: string; label: string; hint: string }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: "var(--color-blue-50)", color: "primary.main", display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
          <Icon fontSize="small" />
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>{label}</Typography>
        <Typography variant="caption" color="text.secondary">{hint}</Typography>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const m = await getDashboardMetrics();

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>Dashboard</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Alcance rápido do estado da operação e atalhos para o dia a dia.
      </Typography>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard icon={ReceiptLongRoundedIcon} value={String(m.orderCount)} label="Pedidos" hint="no total" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard icon={AutorenewRoundedIcon} value={String(m.activeSubscriptions)} label="Assinaturas ativas" hint="membership" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard icon={PaymentsRoundedIcon} value={formatBRL(m.mrr)} label="Receita recorrente" hint="MRR" /></Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><MetricCard icon={PeopleAltRoundedIcon} value={String(m.patientCount)} label="Pacientes" hint="cadastrados" /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        {/* Pedidos recentes */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Pedidos recentes</Typography>
                <Typography component={Link} href="/orders" variant="body2" sx={{ color: "primary.main", textDecoration: "none" }}>Ver todos</Typography>
              </Stack>
              {m.recentOrders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>Sem pedidos.</Typography>
              ) : (
                <Stack divider={<Box sx={{ borderBottom: "1px solid", borderColor: "divider" }} />}>
                  {m.recentOrders.map((o) => (
                    <Stack key={o.id} component={Link} href={`/orders/${o.id}`} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25, textDecoration: "none", color: "inherit", "&:hover": { color: "primary.main" } }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 104 }}>{o.number}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }} noWrap>{o.patientName}</Typography>
                      <Box sx={{ minWidth: 120 }}><OrderStatusChip status={o.status} /></Box>
                      <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 96, textAlign: "right" }}>{formatBRL(o.total)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 96, textAlign: "right" }}>{formatDate(o.createdAt)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>Alertas</Typography>
              <Stack spacing={1.5}>
                <Stack component={Link} href="/subscriptions" direction="row" spacing={1.5} alignItems="center" sx={{ textDecoration: "none", color: "inherit" }}>
                  <WarningAmberRoundedIcon fontSize="small" sx={{ color: m.pastDue > 0 ? "error.main" : "text.disabled" }} />
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{m.pastDue} inadimplentes</Typography>
                    <Typography variant="caption" color="text.secondary">assinaturas com pagamento em atraso</Typography>
                  </Box>
                </Stack>
                <Stack component={Link} href="/botane-sync" direction="row" spacing={1.5} alignItems="center" sx={{ textDecoration: "none", color: "inherit" }}>
                  {m.botaneAlerts > 0
                    ? <SyncRoundedIcon fontSize="small" sx={{ color: "warning.main" }} />
                    : <CheckCircleRoundedIcon fontSize="small" sx={{ color: "success.main" }} />}
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {m.botaneAlerts > 0 ? `${m.botaneAlerts} alertas de sync` : "Sync Botane ok"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">sincronização do catálogo clínico</Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
