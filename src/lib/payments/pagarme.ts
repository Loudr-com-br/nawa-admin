import "server-only";
import { env, pagarmeSecretKey } from "@/lib/env";
import type {
  CaptureInput,
  ConfirmInput,
  CreateIntentInput,
  PaymentIntent,
  PaymentOperation,
  PaymentOutcome,
  PaymentProvider,
  PaymentTxnStatus,
} from "./types";

// Adapter Pagar.me (API Core v5) na mesma porta do stub — o serviço de checkout
// não sabe que provedor está atrás. Ver `types.ts` para o contrato.
//
// Modelo: 1 pedido nosso = 1 `order` no Pagar.me com 1 `charge`. O `provider_ref`
// que guardamos é o ID da COBRANÇA (`ch_…`), não o do pedido — é a cobrança que
// tem estado, que o webhook referencia e que se captura/estorna.
//
// O cartão nunca toca este servidor: o cliente tokeniza com a chave PÚBLICA e nos
// manda só o `card_token`.

const BASE = process.env.PAGARME_API_URL ?? "https://api.pagar.me/core/v5";
const TIMEOUT_MS = 20_000;

// Do payload do Pagar.me declaramos só o que realmente lemos — o resto trafega
// intacto para `raw`, que é o que guardamos para auditoria da transação.
interface PagarmeTransaction {
  status?: string;
  qr_code?: string;
  qr_code_url?: string;
}

interface PagarmeCharge {
  id?: string;
  status?: string;
  last_transaction?: PagarmeTransaction;
}

interface PagarmeOrder {
  charges?: PagarmeCharge[];
}

/** Erro do gateway carregando o contexto da resposta — status e corpo são o que
 *  permite diagnosticar uma recusa depois, sem repetir a chamada. */
class PagarmeError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "PagarmeError";
    this.status = status;
    this.body = body;
  }
}

// Modelo adotado em 14/08: `auth_only` reserva o limite sem cobrar, e a captura
// acontece quando a revisão clínica aprova. O default do CÓDIGO segue
// `auth_and_capture` para não mudar o comportamento de quem não configurou nada;
// o ambiente é que escolhe, sem deploy.
// Sem padrão: assumir `auth_and_capture` calado desfaz a pré-autorização e faz
// o paciente pagar ANTES da avaliação médica — exatamente o que o gate clínico
// existe para impedir. `lib/env` exige a escolha explícita.
const OPERATION = env.PAGARME_OPERATION as PaymentOperation;

// Máx. 13 caracteres no PSP — é o que aparece na fatura do cartão.
const STATEMENT = env.PAGARME_STATEMENT_DESCRIPTOR.slice(0, 13);

function secretKey(): string {
  // Os dois nomes são aceitos e normalizados em `lib/env`, que também já barrou
  // o deploy publicado sem chave quando PAYMENT_PROVIDER=pagarme.
  if (!pagarmeSecretKey) throw new Error("PAGARME_API_KEY ausente");
  return pagarmeSecretKey;
}

/** Basic auth: chave secreta como usuário, senha vazia. */
function authHeader(): string {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`;
}

/** O Pagar.me trabalha em centavos (inteiro); o nosso banco, em reais (numeric). */
function toCents(amount: number): number {
  return Math.round(amount * 100);
}

function onlyDigits(v: string | undefined): string | undefined {
  const d = v?.replace(/\D/g, "");
  return d && d.length > 0 ? d : undefined;
}

/**
 * Telefone brasileiro → formato do Pagar.me. Eles RECUSAM a cobrança se o cliente
 * não tiver ao menos um telefone ("At least one customer phone is required"), então
 * um número malformado é melhor tratado como ausente do que enviado quebrado.
 */
function toPhones(raw: string | undefined): Record<string, unknown> | undefined {
  let d = onlyDigits(raw);
  if (!d) return undefined;
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2); // veio com o código do país
  if (d.length < 10 || d.length > 11) return undefined; // DDD + 8 ou 9 dígitos
  return {
    mobile_phone: { country_code: "55", area_code: d.slice(0, 2), number: d.slice(2) },
  };
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    // Os erros do v5 vêm em `errors` (mapa campo → mensagens) ou `message`.
    const fail = (body ?? {}) as { message?: unknown; errors?: unknown };
    const detail =
      typeof fail.message === "string"
        ? fail.message
        : fail.errors
          ? JSON.stringify(fail.errors)
          : `HTTP ${res.status}`;
    throw new PagarmeError(`pagarme ${res.status}: ${detail}`, res.status, body);
  }
  return body as T;
}

/**
 * Traduz um estado do Pagar.me para o nosso enum. Serve tanto para o status da
 * cobrança quanto para o da transação — ver `statusOfCharge`, que sabe qual vale.
 */
function mapChargeStatus(status: string | undefined): PaymentTxnStatus {
  switch (status) {
    case "paid":
    case "captured":
    case "overpaid":
      return "paid";
    // Limite reservado, dinheiro NÃO capturado. Distinto de `processing` porque o
    // paciente já teve o limite comprometido — é o que libera a revisão clínica.
    case "authorized_pending_capture":
    case "waiting_capture":
      return "authorized";
    case "pending":
    case "processing":
    case "underpaid":
      return "processing";
    case "refunded":
    case "partial_refunded":
    case "canceled":
    case "voided":
      return "refunded";
    case "not_authorized":
    case "failed":
    case "with_error":
    case "chargedback":
      return "failed";
    default:
      return "processing";
  }
}

/**
 * Estado de uma cobrança olhando a TRANSAÇÃO antes do envelope.
 *
 * Numa pré-autorização o Pagar.me deixa a cobrança em `pending` e guarda o
 * `authorized_pending_capture` em `last_transaction.status` — ler só o nível de
 * cima faria uma autorização (limite já reservado) parecer um PIX aguardando
 * pagamento, e o pedido nunca entraria na revisão clínica.
 */
function statusOfCharge(charge: PagarmeCharge | undefined): PaymentTxnStatus {
  const tx = charge?.last_transaction?.status;
  if (tx) {
    const mapped = mapChargeStatus(tx);
    // `processing` do nível da transação não acrescenta nada; aí vale o envelope.
    if (mapped !== "processing") return mapped;
  }
  return mapChargeStatus(charge?.status);
}

/** Extrai a cobrança de um payload de `order` (criamos sempre com uma só). */
function firstCharge(order: PagarmeOrder): PagarmeCharge & { id: string } {
  const charge = order?.charges?.[0];
  if (!charge?.id) throw new Error("pagarme: resposta sem charge");
  return charge as PagarmeCharge & { id: string };
}

/**
 * O que o cliente precisa para concluir: no PIX é o copia-e-cola; no cartão a
 * autorização já aconteceu server-side, então não há segredo a devolver.
 */
function clientTokenOf(charge: PagarmeCharge): string {
  const tx = charge?.last_transaction ?? {};
  return tx.qr_code ?? tx.qr_code_url ?? "";
}

export const pagarmeProvider: PaymentProvider = {
  id: "pagarme",

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const amount = toCents(input.amount);
    const document = onlyDigits(input.customer.document);
    const phones = toPhones(input.customer.phone);

    const b = input.billingAddress;
    const payment: Record<string, unknown> =
      input.method === "credit_card"
        ? {
            payment_method: "credit_card",
            credit_card: {
              card_token: input.paymentToken,
              installments: input.installments ?? 1,
              operation_type: OPERATION,
              statement_descriptor: STATEMENT,
              // O billing address NÃO é tokenizado — precisa vir junto do pedido,
              // aninhado em `card` mesmo quando se paga por token. Sem ele o
              // gateway recusa com "validation_error | billing".
              ...(b
                ? {
                    card: {
                      billing_address: {
                        line_1: b.line1,
                        zip_code: onlyDigits(b.zipCode) ?? b.zipCode,
                        city: b.city,
                        state: b.state,
                        country: b.country ?? "BR",
                      },
                    },
                  }
                : {}),
            },
          }
        : input.method === "boleto"
          ? { payment_method: "boleto", boleto: { instructions: "Pagar até o vencimento." } }
          : { payment_method: "pix", pix: { expires_in: 3600 } };

    if (input.method === "credit_card") {
      if (!input.paymentToken) throw new Error("pagarme: card_token obrigatório para credit_card");
      if (!b) throw new Error("pagarme: endereço de cobrança obrigatório para credit_card");
    }

    const order = await call<PagarmeOrder>("/orders", {
      method: "POST",
      body: JSON.stringify({
        // `code` amarra o pedido do Pagar.me ao nosso — some no dashboard deles.
        code: input.orderId,
        closed: true,
        customer: {
          name: input.customer.name || "Cliente NAWA",
          email: input.customer.email,
          type: "individual",
          ...(document ? { document, document_type: "CPF" } : {}),
          ...(phones ? { phones } : {}),
        },
        items: [
          {
            amount,
            description: `Protocolo NAWA · pedido ${input.orderId.slice(0, 8)}`,
            quantity: 1,
            code: input.orderId,
          },
        ],
        payments: [payment],
        metadata: {
          order_id: input.orderId,
          patient_id: input.customer.patientId,
          ...(input.metadata ?? {}),
        },
      }),
    });

    const charge = firstCharge(order);
    return {
      providerRef: charge.id,
      clientToken: clientTokenOf(charge),
      status: statusOfCharge(charge),
    };
  },

  /**
   * Relê a cobrança e devolve o estado atual. Diferente do stub, aqui `confirm` não
   * cobra nada — a cobrança já foi aberta (e, no cartão com captura, já resolvida)
   * pelo `createIntent`. No PIX o desfecho real chega mesmo é pelo webhook.
   */
  async confirm(input: ConfirmInput): Promise<PaymentOutcome> {
    const charge = await call<PagarmeCharge>(`/charges/${input.providerRef}`, { method: "GET" });
    return {
      providerRef: charge.id ?? input.providerRef,
      status: statusOfCharge(charge),
      raw: { provider: "pagarme", source: "confirm", status: charge.status, charge },
    };
  },

  /** Captura uma cobrança autorizada (fluxo `auth_only` — pós validação clínica). */
  async capture(input: CaptureInput): Promise<PaymentOutcome> {
    const charge = await call<PagarmeCharge>(`/charges/${input.providerRef}/capture`, {
      method: "POST",
      body: JSON.stringify(input.amount != null ? { amount: toCents(input.amount) } : {}),
    });
    return {
      providerRef: charge.id ?? input.providerRef,
      status: statusOfCharge(charge),
      raw: { provider: "pagarme", source: "capture", status: charge.status, charge },
    };
  },

  /**
   * Cancela a cobrança. Numa autorização não capturada o Pagar.me libera o limite;
   * numa já capturada, vira estorno. Mesmo endpoint para os dois casos.
   */
  async cancel(input: CaptureInput): Promise<PaymentOutcome> {
    const charge = await call<PagarmeCharge>(`/charges/${input.providerRef}`, {
      method: "DELETE",
      body: JSON.stringify(input.amount != null ? { amount: toCents(input.amount) } : {}),
    });
    return {
      providerRef: charge.id ?? input.providerRef,
      status: statusOfCharge(charge),
      raw: { provider: "pagarme", source: "cancel", status: charge.status, charge },
    };
  },

  /**
   * Webhook do v5. O Pagar.me NÃO assina o corpo com HMAC — ele autentica por
   * HTTP Basic com o usuário/senha que você cadastra no painel, então o "signature"
   * que chega aqui é o header `Authorization` inteiro. Comparação de tamanho
   * constante para não vazar o segredo por tempo de resposta.
   */
  parseWebhook(rawBody: string, signature: string | null): PaymentOutcome {
    const user = env.PAGARME_WEBHOOK_USER;
    const pass = env.PAGARME_WEBHOOK_PASSWORD;
    if (!user || !pass) throw new Error("PAGARME_WEBHOOK_USER/PASSWORD ausentes");

    const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    if (!signature || !timingSafeEqual(signature, expected)) throw new Error("invalid_signature");

    // `data` é a cobrança nos eventos `charge.*` e o pedido nos `order.*` — daí
    // o tipo carregar as duas formas.
    const evt = JSON.parse(rawBody) as {
      type?: string;
      data?: PagarmeCharge & { charges?: PagarmeCharge[] };
    };
    const data = evt.data ?? {};

    // O evento pode ser de cobrança (`charge.*`, data = a cobrança) ou de pedido
    // (`order.*`, data = o pedido com `charges[]`). Normalizamos para a cobrança.
    const charge = evt.type?.startsWith("order.") ? (data.charges?.[0] ?? {}) : data;
    const providerRef = charge?.id;
    if (!providerRef) throw new Error("missing_provider_ref");

    // O tipo do evento é mais confiável que o status no corpo para os terminais.
    const status: PaymentTxnStatus =
      evt.type === "charge.paid" || evt.type === "order.paid"
        ? "paid"
        : evt.type === "charge.payment_failed" || evt.type === "order.payment_failed"
          ? "failed"
          : evt.type === "charge.refunded"
            ? "refunded"
            : statusOfCharge(charge);

    return {
      providerRef,
      status,
      raw: { provider: "pagarme", source: "webhook", type: evt.type, charge },
    };
  },
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
