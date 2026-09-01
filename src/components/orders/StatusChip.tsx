import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  orderStatusConfig,
  paymentStatusConfig,
} from "@/lib/orders/format";
import type { OrderStatus, PaymentStatus } from "@/lib/orders/types";

/**
 * Fallback para status que existem no enum do banco mas ainda não no config.
 * O tsc não pega esse caso: o status chega do Supabase por `mapOrder`, que é
 * `any`. Sem isto, `cfg` vem undefined e o acesso a `cfg.label` derruba a tela
 * inteira — já aconteceu duas vezes (`awaiting_payment` e `authorized`), e as
 * duas deixaram a operação sem tela em vez de mostrar uma linha a menos.
 */
function unknownStatus(status: string) {
  return { label: status, dot: "#CBD5E1" };
}

/** Status do pedido como ponto discreto + rótulo neutro. */
export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const cfg = orderStatusConfig[status] ?? unknownStatus(status);
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          bgcolor: cfg.dot,
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

const paymentToneColor: Record<string, string> = {
  muted: "text.secondary",
  warning: "warning.main",
  error: "error.main",
};

/** Pagamento em texto simples; cor só quando exige atenção. */
export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
  const cfg = paymentStatusConfig[status] ?? { label: status, tone: "muted" };
  return (
    <Typography
      variant="body2"
      sx={{ color: paymentToneColor[cfg.tone], whiteSpace: "nowrap" }}
    >
      {cfg.label}
    </Typography>
  );
}
