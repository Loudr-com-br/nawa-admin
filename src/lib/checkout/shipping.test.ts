import { describe, it, expect } from "vitest";
import { quoteShipping, resolveShipping } from "./shipping";

/**
 * O contrato de frete é uma regra de segurança, não só de negócio: o front
 * manda o ID da modalidade e NUNCA o preço. Se o preço pudesse vir do cliente,
 * daria para fechar um pedido com frete negativo e abater o total.
 */
describe("frete", () => {
  it("recusa modalidade desconhecida em vez de improvisar um preço", () => {
    expect(resolveShipping("modalidade-inventada")).toBeNull();
    expect(resolveShipping(undefined)).toBeNull();
    expect(resolveShipping("")).toBeNull();
  });

  it("resolve o preço no servidor a partir do ID", () => {
    const opcao = resolveShipping("economica");
    expect(opcao).not.toBeNull();
    expect(typeof opcao!.price).toBe("number");
  });

  it("nunca devolve tarifa negativa", () => {
    for (const o of quoteShipping()) expect(o.price).toBeGreaterThanOrEqual(0);
  });

  it("aceita frete grátis como configuração, não como caso especial", () => {
    // "Frete grátis = tarifa 0" é decisão de config; o código não trata à parte.
    const gratis = quoteShipping().filter((o) => o.price === 0);
    expect(gratis.length).toBeGreaterThan(0);
  });

  it("expõe IDs estáveis — o pedido guarda a escolha por ID", () => {
    const ids = quoteShipping().map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
