import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Recommendation } from "@/lib/anamnesis/recommend";
import type { Cart, CartLine, CartRefType } from "./types";
//
// Carrinho server-side. O `hash` é a âncora estável para métrica de abandono e
// associação posterior (email / paciente logado). Os endpoints usam o admin
// client (service key); a identidade do guest é o próprio hash.

/** Token opaco e URL-safe usado como âncora do carrinho. */
function newHash(): string {
  return "cart_" + randomBytes(12).toString("hex");
}

/** Resolve slug/nome/imagem de itens e protocolos referenciados pelas linhas. */
async function resolveRefs(sb: any, lines: any[]): Promise<Map<string, any>> {
  const itemIds = lines.filter((l) => l.ref_type === "item").map((l) => l.ref_id);
  const protoIds = lines.filter((l) => l.ref_type === "protocol").map((l) => l.ref_id);
  const [items, protos] = await Promise.all([
    itemIds.length ? sb.from("items").select("id, slug, name, image_url").in("id", itemIds) : Promise.resolve({ data: [] }),
    protoIds.length ? sb.from("protocols").select("id, slug, name, image_url").in("id", protoIds) : Promise.resolve({ data: [] }),
  ]);
  const map = new Map<string, any>();
  for (const i of (items as any).data ?? []) map.set(`item:${i.id}`, i);
  for (const p of (protos as any).data ?? []) map.set(`protocol:${p.id}`, p);
  return map;
}

function toCart(cartRow: any, lineRows: any[], refs: Map<string, any>): Cart {
  const lines: CartLine[] = lineRows.map((l) => {
    const ref = refs.get(`${l.ref_type}:${l.ref_id}`) ?? {};
    return {
      refType: l.ref_type as CartRefType,
      refId: l.ref_id,
      slug: ref.slug ?? "",
      name: ref.name ?? "",
      quantity: l.quantity,
      unitPrice: Number(l.unit_price),
      isUpsell: l.is_upsell,
      imageUrl: ref.image_url ?? "",
    };
  });
  const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  return { hash: cartRow.hash, status: cartRow.status, score: cartRow.score != null ? Number(cartRow.score) : null, lines, subtotal };
}

/** Cria o carrinho a partir da recomendação da anamnese. */
export async function createCartFromRecommendation(input: {
  formId: string | null;
  answers: unknown;
  score: number | null;
  recommendation: Recommendation;
  sessionToken?: string | null;
}): Promise<Cart> {
  const sb: any = createAdminClient();
  const hash = newHash();

  const { data: cart, error } = await sb
    .from("carts")
    .insert({
      hash,
      session_token: input.sessionToken ?? null,
      anamnesis_form_id: input.formId,
      anamnesis_answers: input.answers ?? [],
      score: input.score,
    })
    .select("id")
    .single();
  if (error || !cart) throw new Error(`createCart: ${error?.message ?? "sem retorno"}`);

  const lines: any[] = [];
  if (input.recommendation.protocol) {
    const p = input.recommendation.protocol;
    lines.push({ cart_id: cart.id, ref_type: "protocol", ref_id: p.id, quantity: 1, unit_price: p.price, is_upsell: false });
  }
  for (const u of input.recommendation.upsells) {
    lines.push({ cart_id: cart.id, ref_type: "item", ref_id: u.id, quantity: 1, unit_price: u.price, is_upsell: true });
  }
  if (lines.length) await sb.from("cart_lines").insert(lines);

  return (await getCartByHash(hash))!;
}

/** Lê o carrinho pelo hash, com as linhas resolvidas. */
export async function getCartByHash(hash: string): Promise<Cart | null> {
  const sb: any = createAdminClient();
  const { data: cart } = await sb.from("carts").select("id, hash, status, score").eq("hash", hash).maybeSingle();
  if (!cart) return null;
  const { data: rows } = await sb
    .from("cart_lines")
    .select("ref_type, ref_id, quantity, unit_price, is_upsell")
    .eq("cart_id", cart.id)
    .order("is_upsell", { ascending: true });
  const lineRows = rows ?? [];
  const refs = await resolveRefs(sb, lineRows);
  return toCart(cart, lineRows, refs);
}

/**
 * Ajusta uma linha do carrinho. quantity <= 0 remove; caso contrário faz upsert
 * (atualiza a quantidade se a linha existe, senão insere com o preço snapshot
 * resolvido do catálogo publicado). Retorna o carrinho atualizado.
 */
export async function setCartLine(
  hash: string,
  refType: CartRefType,
  refId: string,
  quantity: number
): Promise<Cart | null> {
  const sb: any = createAdminClient();
  const { data: cart } = await sb.from("carts").select("id").eq("hash", hash).maybeSingle();
  if (!cart) return null;

  const { data: existing } = await sb
    .from("cart_lines")
    .select("id")
    .eq("cart_id", cart.id)
    .eq("ref_type", refType)
    .eq("ref_id", refId)
    .maybeSingle();

  if (quantity <= 0) {
    if (existing) await sb.from("cart_lines").delete().eq("id", existing.id);
  } else if (existing) {
    await sb.from("cart_lines").update({ quantity }).eq("id", existing.id);
  } else {
    // resolve o preço snapshot do catálogo publicado + público
    const table = refType === "protocol" ? "protocols" : "items";
    const { data: ref } = await sb
      .from(table)
      .select("price")
      .eq("id", refId)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle();
    if (!ref) throw new Error("ref inválida ou não publicada");
    await sb.from("cart_lines").insert({ cart_id: cart.id, ref_type: refType, ref_id: refId, quantity, unit_price: Number(ref.price), is_upsell: false });
  }

  // toca updated_at (para as métricas de abandono por atividade)
  await sb.from("carts").update({ updated_at: new Date().toISOString() }).eq("id", cart.id);
  return getCartByHash(hash);
}
