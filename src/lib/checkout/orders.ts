import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveShipping } from "./shipping";
//
// Fechamento do pedido (spec §6.2). O front envia o hash do carrinho; o
// backoffice REVALIDA (item ainda publicado + público?), RECALCULA o preço
// server-side (nunca confia no cliente) e cria o pedido "aguardando pagamento".
// Idempotência: um carrinho só converte uma vez (status active → converted).

// v1↔v2: pedidos ainda usam order_items (migração p/ order_lines é Fase 5).
const REF_TYPE_MAP: Record<string, string> = { protocol: "plan", item: "product" };

export type CheckoutResult =
  | {
      orderId: string;
      number: string;
      total: number;
      subtotal: number;
      shipping: number;
      status: string;
    }
  | { error: string; detail?: string };

export async function createOrderFromCart(
  patientId: string,
  cartHash: string,
  shippingOptionId?: string,
): Promise<CheckoutResult> {
  const sb: any = createAdminClient();

  const { data: cart } = await sb.from("carts").select("id, status").eq("hash", cartHash).maybeSingle();
  if (!cart) return { error: "cart_not_found" };
  if (cart.status !== "active") return { error: "cart_already_converted" }; // idempotência

  const { data: lines } = await sb
    .from("cart_lines")
    .select("ref_type, ref_id, quantity")
    .eq("cart_id", cart.id);
  if (!lines?.length) return { error: "cart_empty" };

  // O front escolhe a MODALIDADE; o preço sai da tabela daqui. Um ID desconhecido
  // recusa o pedido em vez de cair em zero silenciosamente.
  const shipping = resolveShipping(shippingOptionId);
  if (shippingOptionId && !shipping) return { error: "shipping_option_unknown", detail: shippingOptionId };
  const shippingTotal = shipping?.price ?? 0;

  // Revalida cada linha contra o catálogo publicado e recalcula o subtotal.
  let total = 0;
  const orderItems: any[] = [];
  for (const l of lines) {
    const table = l.ref_type === "protocol" ? "protocols" : "items";
    const { data: ref } = await sb
      .from(table)
      .select("name, price, status, visibility")
      .eq("id", l.ref_id)
      .maybeSingle();
    if (!ref || ref.status !== "published" || ref.visibility !== "public") {
      return { error: "line_unavailable", detail: l.ref_id };
    }
    const price = Number(ref.price);
    total += price * l.quantity;
    orderItems.push({
      ref_type: REF_TYPE_MAP[l.ref_type] ?? "product",
      ref_id: l.ref_id,
      name: ref.name,
      quantity: l.quantity,
      unit_price: price,
    });
  }

  // Cria o pedido (aguardando pagamento) e suas linhas. `total` já inclui o frete
  // — é o valor que vai ao provedor de pagamento e o que o paciente vê no painel.
  const subtotal = total;
  total += shippingTotal;

  const { data: order, error: orderErr } = await sb
    .from("orders")
    .insert({
      patient_id: patientId,
      total,
      shipping_total: shippingTotal,
      status: "awaiting_payment",
      payment_status: "pending",
    })
    .select("id")
    .single();
  if (orderErr || !order) return { error: `order_create_failed: ${orderErr?.message ?? "?"}` };

  await sb.from("order_items").insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  // Converte o carrinho (idempotência + associação).
  await sb.from("carts").update({ status: "converted", patient_id: patientId }).eq("id", cart.id);

  return {
    orderId: order.id,
    number: `#NAWA-${String(order.id).slice(0, 4).toUpperCase()}`,
    total,
    subtotal,
    shipping: shippingTotal,
    status: "awaiting_payment",
  };
}
