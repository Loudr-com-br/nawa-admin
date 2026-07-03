"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { allNavItems } from "./nav";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { roleLabels } from "@/lib/supabase/roles";
import type { CurrentUser } from "@/lib/supabase/auth";

function usePageTitle() {
  const pathname = usePathname();
  const match = allNavItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/")
  );
  return match?.label ?? "Backoffice";
}

function initials(source: string) {
  const clean = source.split("@")[0].replace(/[._-]+/g, " ").trim();
  return (
    clean
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "NA"
  );
}

export default function Topbar({
  onMenuClick,
  currentUser,
}: {
  onMenuClick: () => void;
  currentUser: CurrentUser | null;
}) {
  const title = usePageTitle();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const email = currentUser?.email ?? "";
  const roleLabel = currentUser?.role ? roleLabels[currentUser.role] : null;

  async function handleSignOut() {
    setAnchorEl(null);
    if (isSupabaseConfigured) {
      await createClient().auth.signOut();
    }
    router.replace("/login");
    router.refresh();
  }

  return (
    <AppBar
      position="sticky"
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
          aria-label="Abrir menu"
        >
          <MenuRoundedIcon />
        </IconButton>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          {title}
        </Typography>

        <Tooltip title="Notificações">
          <IconButton aria-label="Notificações" sx={{ color: "text.secondary" }}>
            <NotificationsNoneRoundedIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title={email || "Conta"}>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ ml: 0.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: "var(--color-blue-50)",
                color: "primary.main",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {initials(email || "NA")}
            </Avatar>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
              {email || "Sessão não iniciada"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {roleLabel ?? (isSupabaseConfigured ? "Sem papel definido" : "Modo mock")}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleSignOut}>
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Sair
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
