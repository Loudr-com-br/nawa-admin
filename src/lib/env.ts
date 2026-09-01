import { z } from "zod";

/**
 * Validação das variáveis de ambiente — falha ALTO e cedo.
 *
 * Existe por causa de uma classe de defeito que já custou caro: comportamento
 * crítico decidido por um valor padrão silencioso. O provedor de pagamento caía
 * em `stub` sozinho, o segredo do webhook do stub tinha uma constante embutida
 * no código e a operação do Pagar.me assumia `auth_and_capture` — os três
 * defeitos eram invisíveis porque a ausência da variável não doía em lugar
 * nenhum. Aqui ela dói: em produção, faltar chave quebra o build.
 *
 * Regra por ambiente:
 *  - produção → tudo que é crítico é OBRIGATÓRIO e explícito. Sem padrão.
 *  - desenvolvimento → padrões convenientes são permitidos, com aviso no console.
 *
 * Roda no build (importado por `next.config.ts`) e no boot do servidor
 * (importado por `instrumentation.ts`), então um deploy mal configurado falha
 * antes de atender a primeira requisição.
 */

/**
 * O contexto vem do Netlify (`production`, `deploy-preview`, `branch-deploy`).
 * Fora dele — máquina local, CI — não existe contexto de deploy.
 *
 * NÃO derivar isto de NODE_ENV: `next build` define NODE_ENV=production em
 * qualquer build, inclusive no CI e no `npm run build` local. Usar NODE_ENV
 * fazia o CI ser tratado como deploy de produção e falhar por não ter as chaves
 * — que ele não deve ter mesmo.
 */
export const DEPLOY_CONTEXT = process.env.CONTEXT ?? "local";

/**
 * Só o deploy de produção é rigoroso. Preview, branch deploy, CI e máquina
 * local seguem soltos: o rigor existe para impedir que um ambiente ATENDENDO
 * TRÁFEGO suba mal configurado, não para atrapalhar quem está construindo.
 *
 * `ENV_STRICT=true` força o rigor em qualquer lugar — útil para conferir a
 * configuração antes de promover.
 */
const strict = DEPLOY_CONTEXT === "production" || process.env.ENV_STRICT === "true";

const required = (nome: string) =>
  z.string().min(1, `${nome} é obrigatório no deploy de produção`);

/** Em produção exige; fora dela aceita ausente. */
const requiredInProd = (nome: string) =>
  strict ? required(nome) : z.string().optional().default("");

const BaseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: requiredInProd("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: requiredInProd("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requiredInProd("SUPABASE_SERVICE_ROLE_KEY"),

  // Sem default: escolher o provedor de pagamento é uma decisão, não uma
  // omissão. Em desenvolvimento o `stub` continua valendo, mas declarado.
  PAYMENT_PROVIDER: strict
    ? z.enum(["stub", "pagarme"], {
        message: "PAYMENT_PROVIDER deve ser 'stub' ou 'pagarme' — sem valor padrão em produção",
      })
    : z.enum(["stub", "pagarme"]).optional().default("stub"),

  // Pagar.me — exigidos condicionalmente abaixo, conforme o provedor.
  // `PAGARME_API_KEY` é o nome usado no painel deles; `PAGARME_SECRET_KEY` é o
  // alias histórico. Aceitamos os dois e normalizamos em `pagarmeSecretKey`.
  PAGARME_API_KEY: z.string().optional().default(""),
  PAGARME_SECRET_KEY: z.string().optional().default(""),
  PAGARME_STATEMENT_DESCRIPTOR: z.string().optional().default("NAWA"),
  PAGARME_WEBHOOK_USER: z.string().optional().default(""),
  PAGARME_WEBHOOK_PASSWORD: z.string().optional().default(""),
  PAGARME_OPERATION: z.enum(["auth_and_capture", "auth_only"]).optional(),
  /** Trava deliberada: chave `sk_live_` só passa com esta variável em "true". */
  PAGARME_ALLOW_LIVE: z.string().optional().default(""),

  STUB_PAYMENT_WEBHOOK_SECRET: z.string().optional().default(""),

  FRONT_REVALIDATE_URL: z.string().optional().default(""),
  FRONT_REVALIDATE_SECRET: z.string().optional().default(""),

  STOREFRONT_RATE_LIMIT: z.coerce.number().int().positive().optional().default(120),
  STOREFRONT_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().optional().default(60),
  /** Limite das rotas de ESCRITA (checkout, pagamento) — por paciente/IP. */
  WRITE_RATE_LIMIT: z.coerce.number().int().positive().optional().default(20),
  WRITE_RATE_WINDOW_SECONDS: z.coerce.number().int().positive().optional().default(60),
});

const EnvSchema = BaseSchema.superRefine((env, ctx) => {
  const erro = (path: string, message: string) =>
    ctx.addIssue({ code: "custom", path: [path], message });

  const chave = env.PAGARME_API_KEY || env.PAGARME_SECRET_KEY;

  if (env.PAYMENT_PROVIDER === "pagarme") {
    if (!chave) {
      erro("PAGARME_API_KEY", "PAGARME_API_KEY (ou PAGARME_SECRET_KEY) é obrigatória quando PAYMENT_PROVIDER=pagarme");
    }
    // O webhook é a fonte da verdade do desfecho: sem credencial não há como
    // distinguir o provedor de qualquer um na internet.
    if (!env.PAGARME_WEBHOOK_USER || !env.PAGARME_WEBHOOK_PASSWORD) {
      erro(
        "PAGARME_WEBHOOK_USER",
        "PAGARME_WEBHOOK_USER e PAGARME_WEBHOOK_PASSWORD são obrigatórios quando PAYMENT_PROVIDER=pagarme",
      );
    }
    // Antes isto assumia `auth_and_capture` calado — o que desfaz a
    // pré-autorização e faz o paciente pagar antes da avaliação médica.
    if (!env.PAGARME_OPERATION) {
      erro(
        "PAGARME_OPERATION",
        "obrigatória quando PAYMENT_PROVIDER=pagarme — use 'auth_only' para preservar o gate clínico",
      );
    }
    // Virar para chave de produção precisa ser um ato deliberado.
    if (chave.startsWith("sk_live_") && env.PAGARME_ALLOW_LIVE !== "true") {
      erro(
        "PAGARME_API_KEY",
        "chave de PRODUÇÃO (sk_live_) detectada. Se é intencional, defina PAGARME_ALLOW_LIVE=true; hoje o ambiente opera em sandbox",
      );
    }
  }

  // O segredo embutido no código valia para qualquer um que lesse o repositório.
  if (env.PAYMENT_PROVIDER === "stub" && strict && !env.STUB_PAYMENT_WEBHOOK_SECRET) {
    erro(
      "STUB_PAYMENT_WEBHOOK_SECRET",
      "obrigatório quando PAYMENT_PROVIDER=stub em um ambiente publicado — sem ele o webhook aceitaria um segredo público",
    );
  }
});

function parseEnv() {
  const parsed = EnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const linhas = parsed.error.issues.map((i) => `  · ${i.path.join(".") || "(env)"}: ${i.message}`);
    throw new Error(
      `Configuração de ambiente inválida (CONTEXT=${DEPLOY_CONTEXT}):\n${linhas.join("\n")}\n\n` +
        `Consulte .env.local.example para a lista completa.`,
    );
  }

  // Fora de produção, avisa em vez de quebrar — o build local segue rodando.
  if (!strict) {
    const avisos: string[] = [];
    if (!process.env.PAYMENT_PROVIDER) avisos.push("PAYMENT_PROVIDER ausente — assumindo 'stub'");
    if (parsed.data.PAYMENT_PROVIDER === "pagarme" && parsed.data.PAGARME_OPERATION !== "auth_only") {
      avisos.push("PAGARME_OPERATION não é 'auth_only' — o gate clínico não vai reservar, vai cobrar");
    }
    if (avisos.length) console.warn(`[env] ${avisos.join(" | ")}`);
  }

  return parsed.data;
}

export const env = parseEnv();
export type Env = typeof env;

/** Chave secreta do Pagar.me, resolvendo o alias histórico. */
export const pagarmeSecretKey = env.PAGARME_API_KEY || env.PAGARME_SECRET_KEY;

/** Sandbox vs produção do provedor, derivado da própria chave. */
export const isPagarmeSandbox = !pagarmeSecretKey.startsWith("sk_live_");
