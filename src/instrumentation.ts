/**
 * Hook de boot do Next. Serve a um único propósito: validar o ambiente antes de
 * a primeira requisição ser atendida.
 *
 * Importar `@/lib/env` já dispara a validação (ela roda no import). Se algo
 * crítico faltar em produção, o erro sobe aqui — na inicialização, com a lista
 * do que falta — em vez de virar um comportamento silencioso lá adiante.
 */
export async function register() {
  const { env, DEPLOY_CONTEXT } = await import("@/lib/env");

  console.log(
    `[boot] contexto=${DEPLOY_CONTEXT} pagamento=${env.PAYMENT_PROVIDER}` +
      (env.PAYMENT_PROVIDER === "pagarme" ? ` operação=${env.PAGARME_OPERATION}` : ""),
  );
}
