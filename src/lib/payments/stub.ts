import "server-only";
import { env } from "@/lib/env";
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
// Sem valor padrão: a constante que existia aqui ("stub-secret") estava no
// repositório, então qualquer pessoa conseguia assinar um webhook e marcar um
// pedido como pago. Vazio agora significa RECUSAR TUDO (ver parseWebhook), e
// `lib/env` já barra o deploy publicado que esquecer de definir o segredo.
const WEBHOOK_SECRET = env.STUB_PAYMENT_WEBHOOK_SECRET;

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
    // Fecha por falta de configuração: segredo vazio recusa qualquer assinatura,
    // inclusive uma assinatura vazia. Nunca "passa porque não foi configurado".
    if (!WEBHOOK_SECRET) throw new Error("webhook_secret_not_configured");
    if (!signature || !timingSafeEqual(signature, WEBHOOK_SECRET)) {
      throw new Error("invalid_signature");
    }
    const body = JSON.parse(rawBody) as { providerRef?: string; status?: PaymentTxnStatus };
    if (!body.providerRef) throw new Error("missing_provider_ref");
    const status = body.status ?? outcomeFromRef(body.providerRef);
    return { providerRef: body.providerRef, status, raw: { provider: "stub", webhook: body } };
  },
};

/** Comparação em tempo constante — não vaza o segredo pela duração da resposta. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
