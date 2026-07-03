import type {
  OrderStatus,
  PaymentStatus,
  Supplier,
} from "./types";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Cor do ponto de status — discreta, o peso vem só do dot de 8px. */
export const orderStatusConfig: Record<
  OrderStatus,
  { label: string; dot: string }
> = {
  paid: { label: "Pago", dot: "#94A3B8" },
  in_production: { label: "Em produção", dot: "#F59E0B" },
  shipped: { label: "Enviado", dot: "#3B82F6" },
  delivered: { label: "Entregue", dot: "#22C55E" },
  failed: { label: "Falho", dot: "#EF4444" },
};

/**
 * Pagamento em texto simples. `tone` só destaca com cor quando exige atenção
 * (pendente/falho); caminho feliz fica neutro para não pesar a tabela.
 */
type PaymentTone = "muted" | "warning" | "error";

export const paymentStatusConfig: Record<
  PaymentStatus,
  { label: string; tone: PaymentTone }
> = {
  paid: { label: "Pago", tone: "muted" },
  pending: { label: "Pendente", tone: "warning" },
  failed: { label: "Falho", tone: "error" },
  refunded: { label: "Reembolsado", tone: "muted" },
};

export const supplierConfig: Record<Supplier, { label: string }> = {
  botane: { label: "Botane" },
  partner: { label: "Parceiro" },
};

/** Ordem canônica dos status para filtros e ordenação. */
export const orderStatusOrder: OrderStatus[] = [
  "paid",
  "in_production",
  "shipped",
  "delivered",
  "failed",
];

export const paymentStatusOrder: PaymentStatus[] = [
  "paid",
  "pending",
  "failed",
  "refunded",
];
