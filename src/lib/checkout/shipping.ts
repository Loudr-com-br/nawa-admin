import "server-only";

// Tarifas de frete — FONTE DA VERDADE (spec §9: o backoffice decide, o front
// apresenta). O checkout manda o ID da modalidade escolhida; o preço é resolvido
// aqui. Se o front pudesse mandar o valor, daria para fechar um pedido com frete
// negativo e abater o total.
//
// Hoje a tabela é fixa. Quando a tabela de contrato dos Correios chegar, o que
// muda é a implementação de `quoteShipping` (que passa a considerar CEP de destino
// e peso) — o contrato com o checkout continua o mesmo.

export interface ShippingOption {
  id: string;
  label: string;
  eta: string;
  price: number; // em reais
}

const TABLE: ShippingOption[] = [
  { id: "economica", label: "Mais econômica", eta: "Em até 4 dias úteis", price: 18.68 },
  { id: "rapida", label: "Mais rápida", eta: "Em até 2 dias úteis", price: 29.16 },
  { id: "retirada", label: "Retirar na loja", eta: "Combinamos com você", price: 0 },
];

/**
 * Modalidades disponíveis. O CEP entra como parâmetro desde já para que ligar os
 * Correios depois não mude a assinatura nem quem chama.
 */
export function quoteShipping(_zipCode?: string): ShippingOption[] {
  return TABLE;
}

/** Resolve a modalidade escolhida. `null` se o ID não existe — pedido é recusado. */
export function resolveShipping(optionId: string | undefined): ShippingOption | null {
  if (!optionId) return null;
  return TABLE.find((o) => o.id === optionId) ?? null;
}
