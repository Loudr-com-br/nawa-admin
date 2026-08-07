import "server-only";
import type {
  ConfirmInput,
  CreateIntentInput,
  PaymentIntent,
  PaymentOutcome,
  PaymentProvider,
  PaymentTxnStatus,
} from "./types";

// Provedor de pagamento FALSO, síncrono e determinístico — sem rede. Serve para
// (1) fechar o funil ponta-a-ponta antes das chaves Pagar.me e (2) exercitar o
// caminho de sucesso E o de falha em teste.
//
// Desfecho determinístico pelo valor (sem Math.random): total terminando em
// R$ x,13 → RECUSA; qualquer outro → APROVA. Assim dá pra testar recusa criando
// um pedido de total .13. O desfecho é codificado no provider_ref, então o
// confirm/webhook o reconstroem sem estado externo.

const FAIL_CENTS = 13;
const WEBHOOK_SECRET = process.env.STUB_PAYMENT_WEBHOOK_SECRET ?? "stub-secret";

function hex(orderId: string): string {
  return orderId.replace(/-/g, "").slice(0, 24);
}
function outcomeForAmount(amount: number): PaymentTxnStatus {
  const cents = Math.round((amount - Math.floor(amount)) * 100);
  return cents === FAIL_CENTS ? "failed" : "paid";
}
function outcomeFromRef(providerRef: string): PaymentTxnStatus {
  return providerRef.startsWith("stub_fail_") ? "failed" : "paid";
}

export const stubProvider: PaymentProvider = {
  id: "stub",

  async createIntent(input: CreateIntentInput): Promise<PaymentIntent> {
    const outcome = outcomeForAmount(input.amount);
    const providerRef = `stub_${outcome === "failed" ? "fail" : "ok"}_${hex(input.orderId)}`;
    return { providerRef, clientToken: `stubtok_${providerRef}`, status: "processing" };
  },

  async confirm(input: ConfirmInput): Promise<PaymentOutcome> {
    const status = outcomeFromRef(input.providerRef);
    return {
      providerRef: input.providerRef,
      status,
      raw: { provider: "stub", confirmedAt: new Date().toISOString(), status },
    };
  },

  parseWebhook(rawBody: string, signature: string | null): PaymentOutcome {
    if (signature !== WEBHOOK_SECRET) throw new Error("invalid_signature");
    const body = JSON.parse(rawBody) as { providerRef?: string; status?: PaymentTxnStatus };
    if (!body.providerRef) throw new Error("missing_provider_ref");
    const status = body.status ?? outcomeFromRef(body.providerRef);
    return { providerRef: body.providerRef, status, raw: { provider: "stub", webhook: body } };
  },
};
