import { NextResponse } from "next/server";
import { authenticateStorefront } from "@/lib/storefront/auth";
import { evaluateAnamnesis, type AnamnesisAnswer } from "@/lib/anamnesis/evaluate";
import { createCartFromRecommendation } from "@/lib/cart/queries";
//
// POST /api/anamnesis/evaluate  (superfície de escrita — spec §6/§7)
// Front envia as respostas; backoffice avalia (score) e devolve a recomendação
// já materializada como CARRINHO server-side. Nunca cacheável.
//
// Auth: por ora reusa a chave da Storefront (server-to-server). A separação de
// escopo read/write é item de endurecimento (semana da fronteira de API).

const NO_STORE = { "Cache-Control": "no-store" };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: NO_STORE });

export async function POST(request: Request) {
  if (!(await authenticateStorefront(request))) return json({ error: "unauthorized" }, 401);

  let body: { formSlug?: string; answers?: AnamnesisAnswer[]; sessionToken?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const formSlug = body?.formSlug;
  const answers = body?.answers;
  if (!formSlug || !Array.isArray(answers)) {
    return json({ error: "formSlug (string) e answers (array) são obrigatórios" }, 400);
  }

  const result = await evaluateAnamnesis(formSlug, answers);
  if (!result) return json({ error: "form_not_found" }, 404);

  const cart = await createCartFromRecommendation({
    formId: result.formId,
    answers,
    score: result.score,
    recommendation: result.recommendation,
    sessionToken: body?.sessionToken ?? null,
  });

  // A recomendação já está refletida no carrinho (linhas base + upsells).
  return json({ score: result.score, band: result.band, cart });
}
