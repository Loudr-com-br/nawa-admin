import "server-only";
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

// `auth_only` reserva o limite sem cobrar — a pré-compra (capturar só após a
// validação clínica). Default é cobrar na hora; trocar a env não exige deploy de código.
const OPERATION = (process.env.PAGARME_OPERATION ?? "auth_and_capture") as PaymentOperation;

// Máx. 13 caracteres no PSP — é o que aparece na fatura do cartão.
const STATEMENT = (process.env.PAGARME_STATEMENT_DESCRIPTOR ?? "NAWA").slice(0, 13);

function secretKey(): string {
  // `PAGARME_API_KEY` é o nome que o painel do Pagar.me usa; `PAGARME_SECRET_KEY`
  // fica como alias para não quebrar quem já configurou com o outro nome.
  const key = process.env.PAGARME_API_KEY ?? process.env.PAGARME_SECRET_KEY;
  if (!key) throw new Error("PAGARME_API_KEY ausente");
  return key;
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

async function call(path: string, init: RequestInit): Promise<any> {
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
  let body: any = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!res.ok) {
    // Os erros do v5 vêm em `errors` (mapa campo → mensagens) ou `message`.
    const detail =
      body?.message ??
      (body?.errors ? JSON.stringify(body.errors) : null) ??
      `HTTP ${res.status}`;
    const err = new Error(`pagarme ${res.status}: ${detail}`);
    (err as any).status = res.status;
    (err as any).body = body;
    throw err;
  }
  return body;
}

/**
 * Traduz o estado da cobrança no Pagar.me para o nosso enum.
 * `authorized_pending_capture` é dinheiro RESERVADO, não recebido — por isso cai em
 * `processing`, e não em `paid`. Tratá-lo como pago liberaria produção sem receber.
 */
function mapChargeStatus(status: string | undefined): PaymentTxnStatus {
  switch (status) {
    case "paid":
    case "captured":
    case "overpaid":
      return "paid";
    case "pending":
    case "processing":
    case "authorized_pending_capture":
    case "waiting_capture":
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

/** Extrai a cobrança de um payload de `order` (criamos sempre com uma só). */
function firstCharge(order: any): any {
  const charge = order?.charges?.[0];
  if (!charge?.id) throw new Error("pagarme: resposta sem charge");
  return charge;
}

/**
 * O que o cliente precisa para concluir: no PIX é o copia-e-cola; no cartão a
 * autorização já aconteceu server-side, então não há segredo a devolver.
 */
function clientTokenOf(charge: any): string {
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

    const order = await call("/orders", {
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
      status: mapChargeStatus(charge.status),
    };
  },

  /**
   * Relê a cobrança e devolve o estado atual. Diferente do stub, aqui `confirm` não
   * cobra nada — a cobrança já foi aberta (e, no cartão com captura, já resolvida)
   * pelo `createIntent`. No PIX o desfecho real chega mesmo é pelo webhook.
   */
  async confirm(input: ConfirmInput): Promise<PaymentOutcome> {
    const charge = await call(`/charges/${input.providerRef}`, { method: "GET" });
    return {
      providerRef: charge.id ?? input.providerRef,
      status: mapChargeStatus(charge.status),
      raw: { provider: "pagarme", source: "confirm", status: charge.status, charge },
    };
  },

  /** Captura uma cobrança autorizada (fluxo `auth_only` — pós validação clínica). */
  async capture(input: CaptureInput): Promise<PaymentOutcome> {
    const charge = await call(`/charges/${input.providerRef}/capture`, {
      method: "POST",
      body: JSON.stringify(input.amount != null ? { amount: toCents(input.amount) } : {}),
    });
    return {
      providerRef: charge.id ?? input.providerRef,
      status: mapChargeStatus(charge.status),
      raw: { provider: "pagarme", source: "capture", status: charge.status, charge },
    };
  },

  /**
   * Webhook do v5. O Pagar.me NÃO assina o corpo com HMAC — ele autentica por
   * HTTP Basic com o usuário/senha que você cadastra no painel, então o "signature"
   * que chega aqui é o header `Authorization` inteiro. Comparação de tamanho
   * constante para não vazar o segredo por tempo de resposta.
   */
  parseWebhook(rawBody: string, signature: string | null): PaymentOutcome {
    const user = process.env.PAGARME_WEBHOOK_USER;
    const pass = process.env.PAGARME_WEBHOOK_PASSWORD;
    if (!user || !pass) throw new Error("PAGARME_WEBHOOK_USER/PASSWORD ausentes");

    const expected = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    if (!signature || !timingSafeEqual(signature, expected)) throw new Error("invalid_signature");

    const evt = JSON.parse(rawBody) as { type?: string; data?: any };
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
            : mapChargeStatus(charge.status);

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
