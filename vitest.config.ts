import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "backend/**"],
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.test.*", "src/app/**/page.tsx"],
      reporter: ["text", "lcov"],
      thresholds: {
        // Phase 10 floor: the shared client library must stay covered.
        "src/lib/**": { statements: 75, branches: 70, functions: 75, lines: 75 },
      },
    },
  },
});
