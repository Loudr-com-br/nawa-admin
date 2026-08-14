import "server-only";
import { pagarmeProvider } from "./pagarme";
import { stubProvider } from "./stub";
import type { PaymentProvider, PaymentProviderId } from "./types";

// Seleção do provedor por ambiente. Default: stub (sem chaves, sem rede).
// `PAYMENT_PROVIDER=pagarme` liga o adapter real — nada no checkout muda.
const CONFIGURED = (process.env.PAYMENT_PROVIDER ?? "stub") as PaymentProviderId;

export function getPaymentProvider(): PaymentProvider {
  switch (CONFIGURED) {
    case "stub":
      return stubProvider;
    case "pagarme":
      return pagarmeProvider;
    default:
      throw new Error(`payment provider desconhecido: ${CONFIGURED}`);
  }
}
