import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * Estes testes existem por causa de dois defeitos reais que chegaram ao ar:
 * a produção rodou o provedor de pagamento `stub` porque a variável não estava
 * definida, e o webhook desse stub aceitava um segredo escrito no repositório.
 * Os dois eram invisíveis — a ausência da configuração não doía em lugar nenhum.
 *
 * O contrato que se testa aqui é: em um ambiente publicado, faltar configuração
 * crítica QUEBRA. Nunca assume, nunca segue calado.
 */

const ORIGINAL = { ...process.env };

/** Carrega `lib/env` do zero com o ambiente informado. */
async function carregar(vars: Record<string, string | undefined>) {
  vi.resetModules();
  process.env = { ...ORIGINAL, ...vars } as NodeJS.ProcessEnv;
  return import("./env");
}

const PRODUCAO = {
  CONTEXT: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://exemplo.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

beforeEach(() => vi.resetModules());
afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("ambiente publicado", () => {
  it("recusa o deploy quando o provedor de pagamento não foi escolhido", async () => {
    await expect(
      carregar({ ...PRODUCAO, PAYMENT_PROVIDER: undefined }),
    ).rejects.toThrow(/PAYMENT_PROVIDER/);
  });

  it("recusa o stub sem segredo de webhook", async () => {
    // Era exatamente este o buraco: sem a variável, valia a constante do código.
    await expect(
      carregar({ ...PRODUCAO, PAYMENT_PROVIDER: "stub", STUB_PAYMENT_WEBHOOK_SECRET: undefined }),
    ).rejects.toThrow(/STUB_PAYMENT_WEBHOOK_SECRET/);
  });

  it("aceita o stub quando o segredo é declarado", async () => {
    const { env } = await carregar({
      ...PRODUCAO,
      PAYMENT_PROVIDER: "stub",
      STUB_PAYMENT_WEBHOOK_SECRET: "um-segredo-de-verdade",
    });
    expect(env.PAYMENT_PROVIDER).toBe("stub");
  });

  it("recusa o Pagar.me sem chave", async () => {
    await expect(
      carregar({ ...PRODUCAO, PAYMENT_PROVIDER: "pagarme" }),
    ).rejects.toThrow(/PAGARME_API_KEY/);
  });

  it("recusa o Pagar.me sem credencial de webhook", async () => {
    await expect(
      carregar({
        ...PRODUCAO,
        PAYMENT_PROVIDER: "pagarme",
        PAGARME_API_KEY: "sk_test_abc",
        PAGARME_OPERATION: "auth_only",
      }),
    ).rejects.toThrow(/PAGARME_WEBHOOK_USER/);
  });

  it("exige a operação explícita — não assume captura direta", async () => {
    // Assumir `auth_and_capture` calado cobra o paciente ANTES da avaliação
    // médica, desfazendo o gate clínico sem nenhum erro aparecer.
    await expect(
      carregar({
        ...PRODUCAO,
        PAYMENT_PROVIDER: "pagarme",
        PAGARME_API_KEY: "sk_test_abc",
        PAGARME_WEBHOOK_USER: "u",
        PAGARME_WEBHOOK_PASSWORD: "p",
        PAGARME_OPERATION: undefined,
      }),
    ).rejects.toThrow(/PAGARME_OPERATION/);
  });

  it("bloqueia chave de produção sem autorização explícita", async () => {
    await expect(
      carregar({
        ...PRODUCAO,
        PAYMENT_PROVIDER: "pagarme",
        PAGARME_API_KEY: "sk_live_perigo",
        PAGARME_WEBHOOK_USER: "u",
        PAGARME_WEBHOOK_PASSWORD: "p",
        PAGARME_OPERATION: "auth_only",
      }),
    ).rejects.toThrow(/sk_live_|PAGARME_ALLOW_LIVE/);
  });

  it("aceita a configuração completa de sandbox", async () => {
    const { env, isPagarmeSandbox } = await carregar({
      ...PRODUCAO,
      PAYMENT_PROVIDER: "pagarme",
      PAGARME_API_KEY: "sk_test_abc",
      PAGARME_WEBHOOK_USER: "u",
      PAGARME_WEBHOOK_PASSWORD: "p",
      PAGARME_OPERATION: "auth_only",
    });
    expect(env.PAGARME_OPERATION).toBe("auth_only");
    expect(isPagarmeSandbox).toBe(true);
  });

  it("exige as chaves do Supabase", async () => {
    await expect(
      carregar({ ...PRODUCAO, PAYMENT_PROVIDER: "stub", STUB_PAYMENT_WEBHOOK_SECRET: "s", SUPABASE_SERVICE_ROLE_KEY: undefined }),
    ).rejects.toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });
});

describe("build fora do Netlify", () => {
  it("não trata um build de CI como deploy de produção", async () => {
    // `next build` define NODE_ENV=production em QUALQUER build. Derivar o rigor
    // disso fazia o CI — que legitimamente não tem as chaves — falhar.
    // O contexto de deploy vem do Netlify, e só dele.
    const { env, DEPLOY_CONTEXT } = await carregar({
      CONTEXT: undefined,
      NODE_ENV: "production",
      CI: "true",
      PAYMENT_PROVIDER: undefined,
      NEXT_PUBLIC_SUPABASE_URL: undefined,
    });
    expect(DEPLOY_CONTEXT).toBe("local");
    expect(env.PAYMENT_PROVIDER).toBe("stub");
  });

  it("permite forçar o rigor com ENV_STRICT, para conferir antes de promover", async () => {
    await expect(
      carregar({ CONTEXT: undefined, ENV_STRICT: "true", PAYMENT_PROVIDER: undefined }),
    ).rejects.toThrow(/PAYMENT_PROVIDER/);
  });
});

describe("desenvolvimento", () => {
  it("segue rodando sem configuração, assumindo o stub", async () => {
    // O rigor é só do ambiente publicado — quebrar o `npm run dev` de quem
    // acabou de clonar o repositório não protegeria ninguém.
    const { env } = await carregar({ CONTEXT: undefined, NODE_ENV: "development", PAYMENT_PROVIDER: undefined });
    expect(env.PAYMENT_PROVIDER).toBe("stub");
  });
});
