import { defineConfig } from "vitest/config";

// Sem este arquivo o vitest sobe a árvore e acha o vite.config.ts da RAIZ
// (frontend), cujo include aponta para src/**/*.test — e não acha nada aqui.
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
