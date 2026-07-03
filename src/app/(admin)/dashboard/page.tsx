import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid2";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import type { SvgIconComponent } from "@mui/icons-material";

type Metric = {
  label: string;
  value: string;
  hint: string;
  icon: SvgIconComponent;
};

// Dados mockados — serão ligados aos módulos reais conforme a seção 11 do spec.
const metrics: Metric[] = [
  { label: "Pedidos recentes", value: "—", hint: "últimas 24h", icon: ReceiptLongRoundedIcon },
  { label: "Assinaturas ativas", value: "—", hint: "membership", icon: AutorenewRoundedIcon },
  { label: "Receita recorrente", value: "—", hint: "MRR", icon: PaymentsRoundedIcon },
  { label: "Aguardando avaliação", value: "—", hint: "fila médica", icon: PendingActionsRoundedIcon },
];

export default function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Alcance rápido do estado da operação e atalhos para o dia a dia.
      </Typography>

      <Grid container spacing={2.5}>
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Grid key={m.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: "var(--color-blue-50)",
                      color: "primary.main",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 2,
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Typography variant="h4" sx={{ fontWeight: 600, lineHeight: 1.1 }}>
                    {m.value}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {m.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {m.hint}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      <Card sx={{ mt: 2.5 }}>
        <CardContent sx={{ py: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Alertas de sincronização Botane
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Sem dados por enquanto. Será alimentado pelo módulo de Sync Botane (§5.11) e
            pelo <code>botane_sync_log</code>.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
