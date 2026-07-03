import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import { getCurrentUser } from "@/lib/supabase/auth";
import { listInternalUsers } from "@/lib/users/queries";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const currentUser = await getCurrentUser();

  if (currentUser?.role !== "super_admin") {
    return (
      <Box sx={{ maxWidth: 640 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Configuração</Typography>
        <Card>
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", py: 4 }}>
            <LockRoundedIcon color="action" />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Acesso restrito</Typography>
              <Typography variant="body2" color="text.secondary">
                A configuração de usuários e papéis é exclusiva do super admin.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const users = await listInternalUsers();
  return <SettingsClient users={users} currentEmail={currentUser.email} />;
}
