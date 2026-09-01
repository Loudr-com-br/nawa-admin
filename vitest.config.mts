import { defineConfig } from "vitest/config";

export default defineConfig({
  // Resolução dos aliases do tsconfig (@/...) — nativa do Vite, sem plugin.
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Os módulos de servidor importam "server-only", pacote cuja única função é
    // quebrar o build quando alguém os importa de um componente de cliente.
    // Fora do Next não existe essa fronteira e o import real lança; o alias
    // aponta para um módulo vazio.
    alias: { "server-only": new URL("./src/test/server-only-stub.ts", import.meta.url).pathname },
  },
});
