import "server-only";
import { pagarmeProvider } from "./pagarme";
import { stubProvider } from "./stub";
import type { PaymentProvider, PaymentProviderId } from "./types";
import { env } from "@/lib/env";

// Seleção do provedor por ambiente. NÃO tem valor padrão em produção: escolher
// entre cobrar de verdade e simular é uma decisão, e `lib/env` recusa o deploy
// se a variável faltar. Em desenvolvimento o padrão segue sendo `stub`.
const CONFIGURED = env.PAYMENT_PROVIDER as PaymentProviderId;

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
