// Substituto de `server-only` nos testes. O pacote real existe apenas para
// falhar o build quando um módulo de servidor é importado de um componente de
// cliente; sob o Vitest não há essa fronteira, e o import real lançaria.
export {};
