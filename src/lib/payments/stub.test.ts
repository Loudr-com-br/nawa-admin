import { describe, it, expect, afterEach, vi } from "vitest";

/**
 * Regressão do defeito mais grave já encontrado no projeto: o webhook do stub
 * comparava a assinatura com uma constante escrita no repositório
 * ("stub-secret"). Como a variável de ambiente nunca tinha sido definida no
 * ambiente publicado, essa constante era o segredo em vigor — e qualquer pessoa
 * conseguia marcar um pedido como pago.
 *
 * O que se garante aqui: sem segredo configurado, o webhook RECUSA. Não existe
 * caminho em que a falta de configuração vire permissão.
 */

const ORIGINAL = { ...process.env };

async function carregarStub(secret: string | undefined) {
  vi.resetModules();
  process.env = { ...ORIGINAL, PAYMENT_PROVIDER: "stub", STUB_PAYMENT_WEBHOOK_SECRET: secret } as NodeJS.ProcessEnv;
  const { stubProvider } = await import("./stub");
  return stubProvider;
}

const CORPO = JSON.stringify({ providerRef: "ref-123", status: "paid" });

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("webhook do stub", () => {
  it("recusa o segredo que ficou no código", async () => {
    const stub = await carregarStub("segredo-de-verdade");
    expect(() => stub.parseWebhook(CORPO, "stub-secret")).toThrow();
  });

  it("recusa tudo quando não há segredo configurado", async () => {
    const stub = await carregarStub(undefined);
    expect(() => stub.parseWebhook(CORPO, "stub-secret")).toThrow(/webhook_secret_not_configured/);
    expect(() => stub.parseWebhook(CORPO, "qualquer-coisa")).toThrow(/webhook_secret_not_configured/);
  });

  it("recusa assinatura ausente ou vazia mesmo com segredo configurado", async () => {
    const stub = await carregarStub("segredo-de-verdade");
    expect(() => stub.parseWebhook(CORPO, null)).toThrow(/invalid_signature/);
    expect(() => stub.parseWebhook(CORPO, "")).toThrow(/invalid_signature/);
  });

  it("aceita a assinatura correta e devolve o desfecho", async () => {
    const stub = await carregarStub("segredo-de-verdade");
    const evt = stub.parseWebhook(CORPO, "segredo-de-verdade");
    expect(evt.providerRef).toBe("ref-123");
    expect(evt.status).toBe("paid");
  });

  it("exige a referência do provedor", async () => {
    const stub = await carregarStub("segredo-de-verdade");
    expect(() => stub.parseWebhook(JSON.stringify({ status: "paid" }), "segredo-de-verdade")).toThrow(
      /missing_provider_ref/,
    );
  });
});
