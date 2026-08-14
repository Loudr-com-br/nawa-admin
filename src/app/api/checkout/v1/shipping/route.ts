import { NextResponse } from "next/server";
import { quoteShipping } from "@/lib/checkout/shipping";

// GET /api/checkout/v1/shipping?cep=00000000 — modalidades de entrega e preços.
//
// O front consome isto para MOSTRAR as opções; ao fechar o pedido devolve só o
// `id` da escolhida. Assim a tarifa tem uma fonte só, e o preço exibido não pode
// divergir do cobrado. Não cacheável: quando os Correios entrarem, a cotação passa
// a depender do CEP.
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const cep = new URL(request.url).searchParams.get("cep") ?? undefined;
  return NextResponse.json({ options: quoteShipping(cep) }, { headers: NO_STORE });
}
