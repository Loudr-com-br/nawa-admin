import { describe, it, expect } from "vitest";
import { subjectOf } from "./rate-limit";

const req = (headers: Record<string, string>) => new Request("https://exemplo/api", { headers });

/**
 * O sujeito do limite decide quem é punido. Errar aqui ou deixa passar o abuso,
 * ou bloqueia clientes legítimos que dividem o mesmo IP (rede corporativa, NAT
 * de operadora móvel — comum no Brasil).
 */
describe("identificação para o rate limit", () => {
  it("prefere o paciente autenticado ao IP", () => {
    expect(subjectOf(req({ "x-forwarded-for": "1.2.3.4" }), "paciente-1")).toBe("patient:paciente-1");
  });

  it("cai para o IP do CDN quando não há sessão", () => {
    expect(subjectOf(req({ "x-nf-client-connection-ip": "9.9.9.9" }))).toBe("ip:9.9.9.9");
  });

  it("usa só o primeiro IP do x-forwarded-for", () => {
    expect(subjectOf(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("ip:1.2.3.4");
  });

  it("nunca devolve chave vazia — sem cabeçalho nenhum ainda há um sujeito", () => {
    expect(subjectOf(req({}))).toBe("ip:desconhecido");
  });

  it("pacientes diferentes não compartilham cota", () => {
    expect(subjectOf(req({}), "a")).not.toBe(subjectOf(req({}), "b"));
  });
});
