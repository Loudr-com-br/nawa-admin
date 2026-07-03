/** Papéis de acesso (spec §7) e rótulos em português. */

export type AppRole = "super_admin" | "catalog_admin" | "doctor" | "operator";

export const roleLabels: Record<AppRole, string> = {
  super_admin: "Super admin",
  catalog_admin: "Admin de catálogo",
  doctor: "Médico",
  operator: "Operador",
};
