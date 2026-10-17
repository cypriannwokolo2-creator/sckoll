import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Route suites do DB round-trips + drizzle-kit push; coverage instrumentation and
    // shared CI runners make the 5s default flaky.
    testTimeout: 20_000,
    hookTimeout: 20_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/test-setup.ts", "src/db/seed.ts", "src/db/embed.ts"],
      reporter: ["text", "lcov"],
      thresholds: {
        // Phase 10 floor: shared backend library must stay covered.
        "src/lib/**": { statements: 60, branches: 65, functions: 60, lines: 60 },
      },
    },
  },
});
