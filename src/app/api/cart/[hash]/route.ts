import { NextResponse } from "next/server";
import { authenticateStorefront } from "@/lib/storefront/auth";
import { getCartByHash, setCartLine } from "@/lib/cart/queries";
import type { CartRefType } from "@/lib/cart/types";
//
// GET   /api/cart/:hash   — lê o carrinho (sessão guest pelo hash).
// PATCH /api/cart/:hash   — ajusta uma linha: { refType, refId, quantity }.
//                            quantity <= 0 remove. Preço snapshot é resolvido
//                            server-side; o valor real é recalculado no checkout.
// Nunca cacheável. Auth reusa a chave da Storefront (server-to-server).

const NO_STORE = { "Cache-Control": "no-store" };
const json = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: NO_STORE });

export async function GET(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  if (!(await authenticateStorefront(request))) return json({ error: "unauthorized" }, 401);
  const { hash } = await params;
  const cart = await getCartByHash(hash);
  if (!cart) return json({ error: "cart_not_found" }, 404);
  return json(cart);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ hash: string }> }) {
  if (!(await authenticateStorefront(request))) return json({ error: "unauthorized" }, 401);
  const { hash } = await params;

  let body: { refType?: CartRefType; refId?: string; quantity?: number } | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const { refType, refId, quantity } = body ?? {};
  if ((refType !== "item" && refType !== "protocol") || !refId || typeof quantity !== "number") {
    return json({ error: "refType ('item'|'protocol'), refId (uuid) e quantity (number) são obrigatórios" }, 400);
  }

  try {
    const cart = await setCartLine(hash, refType, refId, quantity);
    if (!cart) return json({ error: "cart_not_found" }, 404);
    return json(cart);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "erro" }, 400);
  }
}
