// Porta de pagamento (spec §6.2) — provider-agnóstica. O checkout fala com esta
// interface, nunca com um provedor concreto. Hoje: StubProvider síncrono. Amanhã:
// Pagar.me (intent tokenizada no cliente → confirm → webhook), plugável sem tocar
// o serviço de checkout.

export type PaymentProviderId = "stub" | "pagarme";
export type PaymentMethod = "pix" | "credit_card" | "boleto";

// Espelha o enum payment_txn_status da migration.
// `processing` cobre tanto "aguardando o cliente" (PIX não pago) quanto
// "autorizado, aguardando captura" (pré-compra) — o detalhe fica no `raw`.
export type PaymentTxnStatus = "created" | "processing" | "paid" | "failed" | "refunded";

export interface PaymentCustomer {
  patientId: string;
  name: string;
  email: string;
  /**
   * CPF (só dígitos). O PIX do Pagar.me exige documento do pagador. Hoje vem na
   * requisição (o bloco "Dados pessoais" do checkout coleta) porque `patients`
   * ainda não tem coluna de CPF — ver tarefa de persistência.
   */
  document?: string;
  /** Telefone com DDD. O Pagar.me RECUSA a cobrança sem pelo menos um telefone. */
  phone?: string;
}

// Como a cobrança no cartão é aberta. `auth_and_capture` cobra na hora;
// `auth_only` apenas RESERVA o limite e exige um capture posterior — é o modelo de
// pré-compra discutido com o cliente (bloquear o valor e só transacionar após a
// validação clínica do protocolo). Escolhido por env, não por código de chamada.
export type PaymentOperation = "auth_and_capture" | "auth_only";

/** Endereço de cobrança. O Pagar.me RECUSA cobrança no cartão sem ele. */
export interface BillingAddress {
  line1: string; // "Rua Ourique, 120 — Penha Circular"
  zipCode: string; // só dígitos
  city: string;
  state: string; // UF
  country?: string; // ISO-2, default BR
}

export interface CreateIntentInput {
  orderId: string;
  amount: number; // em reais (numeric no banco)
  currency: "BRL";
  method: PaymentMethod;
  customer: PaymentCustomer;
  /** Token do cartão gerado NO CLIENTE. O PAN nunca chega ao nosso servidor. */
  paymentToken?: string;
  installments?: number;
  billingAddress?: BillingAddress;
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

export interface CaptureInput {
  providerRef: string;
  /** Captura parcial, em reais. Omitido = captura o valor autorizado inteiro. */
  amount?: number;
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
  /**
   * Captura uma cobrança autorizada (só existe no fluxo `auth_only`). Opcional: um
   * provedor que sempre captura na autorização não precisa implementar.
   */
  capture?(input: CaptureInput): Promise<PaymentOutcome>;
}
