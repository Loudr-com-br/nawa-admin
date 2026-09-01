import { describe, it, expect } from "vitest";
import {
  orderStatusConfig,
  paymentStatusConfig,
  orderStatusOrder,
  paymentStatusOrder,
} from "./format";

/**
 * Regressão de um defeito que deixou o médico sem a própria fila: a ordem dos
 * status era uma lista escrita à mão, separada do config, e ficou para trás
 * quando o gate clínico adicionou estados novos. O status sumia do filtro e o
 * `indexOf` devolvia -1, embaralhando a ordenação.
 *
 * A correção foi derivar a ordem do config. O teste trava isso: se alguém
 * voltar a escrever a lista à mão e esquecer um status, aqui quebra.
 */
describe("ordem dos status", () => {
  it("cobre todo status de pedido que o config conhece", () => {
    expect([...orderStatusOrder].sort()).toEqual(Object.keys(orderStatusConfig).sort());
  });

  it("cobre todo status de pagamento que o config conhece", () => {
    expect([...paymentStatusOrder].sort()).toEqual(Object.keys(paymentStatusConfig).sort());
  });

  it("inclui os estados do gate clínico — a fila do médico depende disto", () => {
    expect(orderStatusOrder).toContain("in_clinical_review");
    expect(orderStatusOrder).toContain("clinically_rejected");
  });

  it("inclui o valor reservado da pré-autorização", () => {
    expect(paymentStatusOrder).toContain("authorized");
  });

  it("não deixa nenhum status fora da ordenação (indexOf nunca -1)", () => {
    for (const s of Object.keys(orderStatusConfig)) {
      expect(orderStatusOrder.indexOf(s as never)).toBeGreaterThanOrEqual(0);
    }
  });
});
