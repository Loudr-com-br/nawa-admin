// Protocolos v2 — o protocolo é um KIT: curadoria NAWA de itens do catálogo,
// com preço próprio (spec catalogo-protocolos-v2 §5, §6, §8).
import type { ContentStatus, ItemType, Visibility } from "@/lib/catalog/types";

export type ClaimStatus = "draft" | "pending_review" | "approved" | "rejected";
export type PriceSource = "sum" | "manual";

/** Item do kit — linha de protocol_items já unida ao item do catálogo. */
export interface ProtocolMember {
  id: string; // protocol_items.id
  itemId: string;
  quantity: number;
  order: number;
  // snapshot do item (leitura)
  name: string;
  price: number;
  visibility: Visibility;
  itemType: ItemType;
  supplierName: string;
  isGlp1: boolean;
}

export interface Protocol {
  id: string;
  slug: string;
  name: string;
  clinicalDescription: string;
  price: number;
  priceSource: PriceSource;
  visibility: Visibility;
  claimStatus: ClaimStatus;
  status: ContentStatus;
  version: number;
  itemCount: number;
  /** Soma atual dos itens (preço × quantidade) — base do aviso de deriva. */
  itemsSum: number;
  createdAt: string;
}

export interface ProtocolDetail extends Protocol {
  claimInternal: string;
  claimPublic: string;
  claimReviewedAt: string | null;
  pageContent: string;
  members: ProtocolMember[];
}

export const claimStatusLabels: Record<ClaimStatus, string> = {
  draft: "Rascunho",
  pending_review: "Em revisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
};

/** Cor semântica do estado do claim (bloqueio regulatório — mostrar com destaque §8). */
export const claimStatusColor: Record<ClaimStatus, "default" | "warning" | "success" | "error"> = {
  draft: "default",
  pending_review: "warning",
  approved: "success",
  rejected: "error",
};

export const priceSourceLabels: Record<PriceSource, string> = {
  sum: "Soma dos itens",
  manual: "Manual",
};

/** Diferença entre a soma atual dos itens e o preço do kit. >0 = kit abaixo da soma. */
export function priceDrift(price: number, itemsSum: number): number {
  return itemsSum - price;
}

/** Há deriva relevante (arredonda a centavos para evitar ruído de float). */
export function hasDrift(price: number, itemsSum: number): boolean {
  return Math.abs(priceDrift(price, itemsSum)) >= 0.01;
}
