import type { ContentStatus } from "@/lib/catalog/types";
import { formatBRL } from "@/lib/catalog/types";

export type PromotionType = "percent" | "fixed";

export interface Promotion {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  validFrom: string | null;
  validTo: string | null;
  status: ContentStatus;
  createdAt: string;
}

export const promotionTypeLabels: Record<PromotionType, string> = {
  percent: "Percentual",
  fixed: "Valor fixo",
};

/** Ex: "10%" ou "R$ 50,00". */
export function formatPromotionValue(type: PromotionType, value: number): string {
  return type === "percent" ? `${value}%` : formatBRL(value);
}

/** Estado da vigência agora: agendada, ativa, expirada ou sem período. */
export function validityState(
  validFrom: string | null,
  validTo: string | null
): "none" | "scheduled" | "active" | "expired" {
  const now = Date.now();
  if (validFrom && new Date(validFrom).getTime() > now) return "scheduled";
  if (validTo && new Date(validTo).getTime() < now) return "expired";
  if (!validFrom && !validTo) return "none";
  return "active";
}
