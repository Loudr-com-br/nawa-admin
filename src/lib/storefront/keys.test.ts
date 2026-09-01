import { describe, it, expect } from "vitest";
import { generateApiKey, hashApiKey } from "./keys";

/**
 * A chave da Storefront é guardada como hash, nunca em texto puro — um dump do
 * banco não pode virar acesso à API.
 */
describe("chaves da Storefront", () => {
  it("guarda hash, não a chave", () => {
    const { raw, hash } = generateApiKey();
    expect(hash).not.toContain(raw);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("gera chave nova a cada chamada", () => {
    expect(generateApiKey().raw).not.toBe(generateApiKey().raw);
  });

  it("hash é determinístico — é assim que a validação compara", () => {
    const { raw, hash } = generateApiKey();
    expect(hashApiKey(raw)).toBe(hash);
  });

  it("o prefixo guardado identifica a chave sem revelá-la", () => {
    const { raw, prefix } = generateApiKey();
    expect(raw.startsWith(prefix)).toBe(true);
    expect(prefix.length).toBeLessThan(raw.length / 2);
  });
});
