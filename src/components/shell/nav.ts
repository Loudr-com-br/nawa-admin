import type { SvgIconComponent } from "@mui/icons-material";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import ScienceRoundedIcon from "@mui/icons-material/ScienceRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import LocalOfferRoundedIcon from "@mui/icons-material/LocalOfferRounded";
import SyncRoundedIcon from "@mui/icons-material/SyncRounded";
import VpnKeyRoundedIcon from "@mui/icons-material/VpnKeyRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import GppGoodRoundedIcon from "@mui/icons-material/GppGoodRounded";

export type NavItem = {
  href: string;
  label: string;
  icon: SvgIconComponent;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/** Navegação do backoffice — reflete os módulos da seção 5 do spec. */
export const navGroups: NavGroup[] = [
  {
    title: "Visão geral",
    items: [{ href: "/dashboard", label: "Dashboard", icon: DashboardRoundedIcon }],
  },
  {
    title: "Operação",
    items: [
      { href: "/orders", label: "Pedidos", icon: ReceiptLongRoundedIcon },
      { href: "/subscriptions", label: "Assinaturas", icon: AutorenewRoundedIcon },
      { href: "/patients", label: "Pacientes", icon: PeopleAltRoundedIcon },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/catalog", label: "Catálogo", icon: Inventory2RoundedIcon },
      { href: "/protocols", label: "Protocolos", icon: ScienceRoundedIcon },
      { href: "/collections", label: "Coleções", icon: CategoryRoundedIcon },
      { href: "/anamnesis", label: "Anamnese", icon: AssignmentRoundedIcon },
      { href: "/promotions", label: "Promoções", icon: LocalOfferRoundedIcon },
    ],
  },
  {
    title: "Integração",
    items: [
      { href: "/botane-sync", label: "Sync Botane", icon: SyncRoundedIcon },
      { href: "/api-keys", label: "Chaves de API", icon: VpnKeyRoundedIcon },
    ],
  },
  {
    title: "Sistema",
    items: [
      { href: "/settings", label: "Configuração", icon: SettingsRoundedIcon },
      { href: "/audit", label: "Auditoria & LGPD", icon: GppGoodRoundedIcon },
    ],
  },
];

/** Lista achatada de todos os itens, útil para breadcrumbs e títulos. */
export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);
