import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { subStatusConfig, type SubscriptionStatus } from "@/lib/subscriptions/types";

/** Status de assinatura como ponto discreto + rótulo. */
export default function SubscriptionStatusChip({ status }: { status: SubscriptionStatus }) {
  const cfg = subStatusConfig[status];
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: cfg.dot, flexShrink: 0 }} />
      <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>{cfg.label}</Typography>
    </Box>
  );
}
