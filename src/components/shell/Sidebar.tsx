"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Typography from "@mui/material/Typography";
import { navGroups } from "./nav";

export const DRAWER_WIDTH = 264;

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Brand */}
      <Box sx={{ px: 3, py: 2.5, display: "flex", alignItems: "center" }}>
        <Link href="/dashboard" style={{ display: "inline-flex" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo/nawa_logo_azul01.png" alt="NAWA" style={{ height: 32 }} />
        </Link>
      </Box>

      {/* Nav */}
      <Box sx={{ flex: 1, overflowY: "auto", pb: 2 }}>
        {navGroups.map((group) => (
          <List
            key={group.title}
            dense
            sx={{ px: 0 }}
            subheader={
              <ListSubheader
                disableSticky
                sx={{
                  bgcolor: "transparent",
                  color: "text.disabled",
                  fontSize: 10.5,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  lineHeight: 2.4,
                  px: 3,
                }}
              >
                {group.title}
              </ListSubheader>
            }
          >
            {group.items.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.href}
                  component={Link}
                  href={item.href}
                  onClick={onNavigate}
                  selected={active}
                  disableRipple
                  sx={{
                    mx: 1.5,
                    my: 0.125,
                    borderRadius: 2,
                    color: active ? "primary.main" : "text.secondary",
                    "&.Mui-selected": {
                      bgcolor: "var(--color-blue-50)",
                      "&:hover": { bgcolor: "var(--color-blue-100)" },
                    },
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: "inherit" }}>
                    <Icon sx={{ fontSize: 20 }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        ))}
      </Box>

      <Box sx={{ px: 3, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Typography variant="caption" color="text.disabled">
          NAWA Health · 2026
        </Typography>
      </Box>
    </Box>
  );
}
