/**
 * Tipos do domínio de Pedidos — alinhados ao esboço do modelo de dados (spec §6).
 * Enquanto o Supabase não é ligado, os dados vêm de mock (ver mock.ts).
 */

export type OrderStatus =
  | "paid"
  | "in_production"
  | "shipped"
  | "delivered"
  | "failed";

export type PaymentStatus = "paid" | "pending" | "failed" | "refunded";

export type Supplier = "botane" | "partner";

export type OrderItemRef = "plan" | "formula" | "product";

export interface OrderItem {
  id: string;
  refType: OrderItemRef;
  name: string;
  /** Preenchido apenas para itens clínicos (fórmulas). */
  supplier?: Supplier;
  isGlp1?: boolean;
  quantity: number;
  unitPrice: number;
}

export interface OrderEvent {
  at: string; // ISO
  label: string;
  description?: string;
}

export interface OrderPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  /** Número legível exibido na operação (ex: #NAWA-1042). */
  number: string;
  patient: OrderPatient;
  plan: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  /** Método tokenizado — a NAWA nunca guarda o cartão (spec §8.5). */
  paymentMethod: string;
  items: OrderItem[];
  total: number;
  protocolName?: string;
  prescriptionId?: string;
  botaneOrderRef?: string;
  createdAt: string; // ISO
  history: OrderEvent[];
}
