export type ContentStatus = "draft" | "published";

export interface Plan {
  id: string;
  journeyId: string | null;
  journeyName: string;
  slug: string;
  name: string;
  basePrice: number;
  billingInterval: string;
  inclusions: string[];
  status: ContentStatus;
  createdAt: string;
}

export type ProductRefType = "plan" | "formula";

export interface CommercialProduct {
  id: string;
  refType: ProductRefType;
  refId: string | null;
  name: string;
  price: number;
  isAddon: boolean;
  status: ContentStatus;
  createdAt: string;
}

/** Opção para o select de referência do produto (plano ou fórmula). */
export interface RefOption {
  id: string;
  label: string;
  refType: ProductRefType;
}

export const statusLabels: Record<ContentStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

export const billingIntervals = ["monthly", "quarterly", "yearly"] as const;

export const billingLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
