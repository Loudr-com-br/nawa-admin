import "server-only";
import { stubProvider } from "./stub";
import type { PaymentProvider, PaymentProviderId } from "./types";

// Seleção do provedor por ambiente. Default: stub (sem chaves, sem rede).
// Quando as credenciais Pagar.me chegarem, criar `pagarme.ts` implementando a
// mesma porta e ligar aqui — nada mais no checkout muda.
const CONFIGURED = (process.env.PAYMENT_PROVIDER ?? "stub") as PaymentProviderId;

export function getPaymentProvider(): PaymentProvider {
  switch (CONFIGURED) {
    case "stub":
      return stubProvider;
    case "pagarme":
      throw new Error("payment provider 'pagarme' ainda não configurado (faltam chaves/SDK)");
    default:
      throw new Error(`payment provider desconhecido: ${CONFIGURED}`);
  }
}
