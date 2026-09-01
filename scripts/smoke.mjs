/**
 * Smoke pós-deploy — verifica um ambiente JÁ PUBLICADO.
 *
 * Não substitui os testes: eles provam regras de negócio em isolamento, isto
 * prova que o que subiu está de pé e configurado. A diferença importa porque o
 * histórico do projeto tem três defeitos que passaram por typecheck limpo e só
 * apareceram ao vivo.
 *
 * Nenhuma verificação aqui altera dados. A do webhook usa uma referência que
 * não existe de propósito, e o que se mede é a rejeição da assinatura — não o
 * processamento.
 *
 * Uso:
 *   node scripts/smoke.mjs --backoffice=https://... --frontoffice=https://...
 */

const arg = (nome, padrao) => {
  const achado = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return achado ? achado.slice(nome.length + 3) : padrao;
};

const BO = arg("backoffice", "https://nawahealth.netlify.app").replace(/\/$/, "");
const FO = arg("frontoffice", "https://nawa-storefront.netlify.app").replace(/\/$/, "");

const resultados = [];

async function checar(nome, fn) {
  try {
    const detalhe = await fn();
    resultados.push({ nome, ok: true, detalhe });
  } catch (e) {
    resultados.push({ nome, ok: false, detalhe: e.message });
  }
}

/** Falha com uma mensagem que diz o esperado e o obtido — erro tem que ensinar. */
function esperar(condicao, mensagem) {
  if (!condicao) throw new Error(mensagem);
}

const buscar = (url, init) => fetch(url, { redirect: "manual", ...init });

// ── Backoffice ────────────────────────────────────────────────────────────
await checar("backoffice responde e exige login", async () => {
  const r = await buscar(`${BO}/`);
  esperar([301, 302, 307, 308].includes(r.status), `esperava redirecionar para o login, veio ${r.status}`);
  return `HTTP ${r.status}`;
});

await checar("catálogo recusa requisição sem chave", async () => {
  const r = await buscar(`${BO}/api/storefront/v1/items`);
  esperar(r.status === 401, `esperava 401 sem chave, veio ${r.status}`);
  return "401";
});

await checar("tabela de frete responde", async () => {
  const r = await buscar(`${BO}/api/checkout/v1/shipping`);
  esperar(r.status === 200, `esperava 200, veio ${r.status}`);
  const body = await r.json();
  const opcoes = body.options ?? body;
  esperar(Array.isArray(opcoes) && opcoes.length > 0, "nenhuma modalidade de frete devolvida");
  esperar(opcoes.every((o) => typeof o.price === "number" && o.price >= 0), "tarifa ausente ou negativa");
  return `${opcoes.length} modalidades`;
});

await checar("cadastro do paciente exige sessão", async () => {
  const r = await buscar(`${BO}/api/checkout/v1/patient`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  esperar(r.status === 401, `esperava 401 sem token, veio ${r.status}`);
  return "401";
});

// A verificação mais importante deste arquivo. O webhook já aceitou um segredo
// que estava escrito no repositório, e com ele qualquer pessoa marcava um
// pedido como pago. Se algum dia isto voltar a passar, o deploy falha aqui.
await checar("webhook recusa o segredo que ficou no código", async () => {
  const r = await buscar(`${BO}/api/payments/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-stub-signature": "stub-secret" },
    body: JSON.stringify({ providerRef: "smoke-referencia-inexistente", status: "paid" }),
  });
  esperar(
    r.status === 401,
    `REGRESSÃO DE SEGURANÇA: o webhook não recusou o segredo público (HTTP ${r.status}). ` +
      `Qualquer pessoa pode marcar um pedido como pago.`,
  );
  return "401";
});

await checar("backoffice envia headers de segurança", async () => {
  const r = await buscar(`${BO}/login`);
  const frame = r.headers.get("x-frame-options");
  esperar(frame?.toUpperCase() === "DENY", `X-Frame-Options ausente ou fraco: ${frame ?? "(nenhum)"}`);
  esperar(!!r.headers.get("strict-transport-security"), "HSTS ausente");
  return "X-Frame-Options + HSTS";
});

// ── Frontoffice ───────────────────────────────────────────────────────────
await checar("loja responde", async () => {
  const r = await buscar(`${FO}/`);
  esperar(r.status === 200, `esperava 200, veio ${r.status}`);
  return "200";
});

await checar("checkout responde", async () => {
  const r = await buscar(`${FO}/checkout`);
  esperar(r.status === 200, `esperava 200, veio ${r.status}`);
  return "200";
});

await checar("revalidação recusa segredo errado", async () => {
  const r = await buscar(`${FO}/api/revalidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": "errado" },
    body: JSON.stringify({ tags: [] }),
  });
  esperar(r.status === 401, `esperava 401, veio ${r.status}`);
  return "401";
});

await checar("loja envia headers de segurança", async () => {
  const r = await buscar(`${FO}/`);
  const frame = r.headers.get("x-frame-options");
  esperar(frame?.toUpperCase() === "DENY", `X-Frame-Options ausente ou fraco: ${frame ?? "(nenhum)"}`);
  return "X-Frame-Options";
});

// ── Relatório ─────────────────────────────────────────────────────────────
console.log(`\nSmoke — backoffice ${BO}\n         frontoffice ${FO}\n`);
for (const r of resultados) {
  console.log(`  ${r.ok ? "ok  " : "FALHA"}  ${r.nome}${r.detalhe ? ` — ${r.detalhe}` : ""}`);
}

const falhas = resultados.filter((r) => !r.ok);
console.log(`\n${resultados.length - falhas.length}/${resultados.length} verificações passaram\n`);
process.exit(falhas.length ? 1 : 0);
