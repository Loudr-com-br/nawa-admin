// Porta de pagamento (spec §6.2) — provider-agnóstica. O checkout fala com esta
// interface, nunca com um provedor concreto. Hoje: StubProvider síncrono. Amanhã:
// Pagar.me (intent tokenizada no cliente → confirm → webhook), plugável sem tocar
// o serviço de checkout.

export type PaymentProviderId = "stub" | "pagarme";
export type PaymentMethod = "pix" | "credit_card" | "boleto";

// Espelha o enum payment_txn_status da migration.
export type PaymentTxnStatus = "created" | "processing" | "paid" | "failed" | "refunded";

export interface PaymentCustomer {
  patientId: string;
  name: string;
  email: string;
}

export interface CreateIntentInput {
  orderId: string;
  amount: number; // em reais (numeric no banco)
  currency: "BRL";
  method: PaymentMethod;
  customer: PaymentCustomer;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntent {
  providerRef: string; // id da intent/cobrança no provedor
  // Segredo que o cliente usa p/ concluir o pagamento (client_secret do cartão,
  // QR do Pix, linha do boleto…). No stub é um token fake e inócuo.
  clientToken: string;
  status: PaymentTxnStatus;
}

export interface ConfirmInput {
  providerRef: string;
  paymentToken?: string; // devolvido pelo cliente após tokenizar (opcional no stub)
}

// Desfecho normalizado — mesma forma para o confirm síncrono e para o webhook.
export interface PaymentOutcome {
  providerRef: string;
  status: PaymentTxnStatus; // paid | failed | processing | refunded
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  /** Abre a cobrança no provedor e devolve o segredo p/ o cliente concluir. */
  createIntent(input: CreateIntentInput): Promise<PaymentIntent>;
  /** Confirma a cobrança (síncrono no stub; no Pagar.me o real vem por webhook). */
  confirm(input: ConfirmInput): Promise<PaymentOutcome>;
  /** Verifica a assinatura e normaliza o payload cru do webhook. Lança se inválida. */
  parseWebhook(rawBody: string, signature: string | null): PaymentOutcome;
}
