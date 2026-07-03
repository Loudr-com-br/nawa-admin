import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { getCurrentUser } from "@/lib/supabase/auth";
import { listAuditLog } from "@/lib/audit/queries";
import AuditClient from "./AuditClient";

export default async function AuditPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "super_admin") {
    return (
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Auditoria & LGPD</Typography>
        <Card>
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", py: 4 }}>
            <LockRoundedIcon color="action" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
              <Typography variant="body2" color="text.secondary">
                A trilha de auditoria é exclusiva do super admin.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const entries = await listAuditLog();
  return <AuditClient entries={entries} />;
}
