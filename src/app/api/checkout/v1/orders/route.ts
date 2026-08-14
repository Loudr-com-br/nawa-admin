import { NextResponse } from "next/server";
import { authenticateAuthUser } from "@/lib/patient/auth";
import { resolveOrCreatePatient } from "@/lib/checkout/patient";
import { createOrderFromCart } from "@/lib/checkout/orders";

// POST /api/checkout/orders — fecha o carrinho num pedido (spec §6.2).
// Auth: sessão do paciente (JWT). Guest→conta: cria o `patients` se não existir.
// Não cacheável. Idempotente (carrinho só converte uma vez).
const NO_STORE = { "Cache-Control": "no-store" };
const json = (d: unknown, s = 200) => NextResponse.json(d, { status: s, headers: NO_STORE });

export async function POST(request: Request) {
  const user = await authenticateAuthUser(request);
  if (!user) return json({ error: "unauthorized" }, 401);

  // `shippingOptionId` é a MODALIDADE escolhida, não o preço — a tarifa é
  // resolvida no servidor (spec §9).
  let body: { cartHash?: string; name?: string; shippingOptionId?: string } | null = null;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (!body?.cartHash) return json({ error: "cartHash é obrigatório" }, 400);

  const patientId = await resolveOrCreatePatient(user, body.name);
  const result = await createOrderFromCart(patientId, body.cartHash, body.shippingOptionId);
  if ("error" in result) return json(result, 400);
  return json(result);
}
