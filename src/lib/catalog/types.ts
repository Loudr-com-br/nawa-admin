// Catálogo v2 — o item/SKU é a unidade única do catálogo (spec catalogo-protocolos-v2 §5).
// Este arquivo também abriga tipos/utilitários compartilhados (ContentStatus, formatBRL,
// billing*) importados por outros módulos — manter.

export type ContentStatus = "draft" | "published";

export type Visibility = "public" | "medical_only";
export type ItemType = "manipulado" | "medicamento" | "suplemento" | "servico";
export type PharmaceuticalForm =
  | "capsula" | "sache" | "sublingual" | "topico" | "outro" | "na";
export type SupplierType = "pharmacy" | "partner" | "internal";

export interface SupplierOption {
  id: string;
  slug: string;
  name: string;
  type: SupplierType;
}

export interface ItemCaution {
  type: string;
  description: string;
}

/** Item / SKU — vem pronto do fornecedor; a NAWA enriquece preço/visibilidade. */
export interface Item {
  id: string;
  slug: string;
  name: string;
  // Origem (fornecedor)
  supplierId: string;
  supplierName: string;
  supplierType: SupplierType;
  supplierSlug: string;
  externalRef: string | null;
  // Propriedade do fornecedor (read-only p/ fornecedor externo — §9)
  itemType: ItemType;
  pharmaceuticalForm: PharmaceuticalForm;
  description: string | null;
  composition: Record<string, unknown>;
  cautions: ItemCaution[];
  cost: number | null;
  // Propriedade da NAWA
  price: number;
  isGlp1: boolean;
  sellsStandalone: boolean;
  visibility: Visibility;
  status: ContentStatus;
  // Metadados
  syncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Rótulos e listas (ordem de exibição) ──
export const itemTypes: ItemType[] = ["manipulado", "medicamento", "suplemento", "servico"];
export const itemTypeLabels: Record<ItemType, string> = {
  manipulado: "Manipulado",
  medicamento: "Medicamento",
  suplemento: "Suplemento",
  servico: "Serviço",
};

export const pharmaceuticalForms: PharmaceuticalForm[] = [
  "capsula", "sache", "sublingual", "topico", "outro", "na",
];
export const formLabels: Record<PharmaceuticalForm, string> = {
  capsula: "Cápsula",
  sache: "Sachê",
  sublingual: "Sublingual",
  topico: "Tópico",
  outro: "Outro",
  na: "N/A",
};

export const visibilities: Visibility[] = ["public", "medical_only"];
export const visibilityLabels: Record<Visibility, string> = {
  public: "Pública",
  medical_only: "Só médico",
};

export const supplierTypeLabels: Record<SupplierType, string> = {
  pharmacy: "Farmácia",
  partner: "Parceiro",
  internal: "Interno (NAWA)",
};

export const statusLabels: Record<ContentStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
};

// Recorrência — usado por outros módulos (planos/jornadas). Mantido aqui.
export const billingIntervals = ["monthly", "quarterly", "yearly"] as const;
export const billingLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  yearly: "Anual",
};

// ── Regras de negócio de item ──
/** Medicamento é sempre medical_only (regra dura §7): a UI trava o seletor. */
export function forcesMedicalOnly(itemType: ItemType): boolean {
  return itemType === "medicamento";
}

/** Fornecedor externo (não-NAWA) é dono da composição/dose/custo — read-only (§9). */
export function isSupplierOwnedReadOnly(supplierType: SupplierType): boolean {
  return supplierType !== "internal";
}

/** Margem % quando há custo do fornecedor. Null quando cost ausente ou preço zero. */
export function computeMargin(price: number, cost: number | null): number | null {
  if (cost == null || price <= 0) return null;
  return ((price - cost) / price) * 100;
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Extrai o texto bruto de composição (migração guardou `dosage` em `{ raw }`). */
export function compositionRaw(composition: Record<string, unknown>): string | null {
  const raw = composition?.raw;
  return typeof raw === "string" && raw.trim() ? raw : null;
}
