import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // tsconfig.json の paths（"@/*"）を解決する。Vite ネイティブ機能。
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.ts"],
  },
});
