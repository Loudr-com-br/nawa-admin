import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  orderStatusConfig,
  paymentStatusConfig,
} from "@/lib/orders/format";
import type { OrderStatus, PaymentStatus } from "@/lib/orders/types";

/** Status do pedido como ponto discreto + rótulo neutro. */
export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const cfg = orderStatusConfig[status];
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
  const cfg = paymentStatusConfig[status];
  return (
    <Typography
      variant="body2"
      sx={{ color: paymentToneColor[cfg.tone], whiteSpace: "nowrap" }}
    >
      {cfg.label}
    </Typography>
  );
}
