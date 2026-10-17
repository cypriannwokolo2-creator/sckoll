import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against a production build (`npm run build` first) with the API reachable at
 * E2E_API_URL. NEXT_PUBLIC_* is inlined at build time, so build and serve with the same value:
 *
 *   NEXT_PUBLIC_API_URL=http://127.0.0.1:8110 npm run build && npm run test:e2e
 */
const PORT = Number(process.env.E2E_PORT ?? 3456);
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { NEXT_PUBLIC_API_URL: process.env.E2E_API_URL ?? "http://127.0.0.1:8110" },
  },
});
