import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook (stable API, bundler-agnostic — works with the
 * Turbopack build, so no withSentryConfig/webpack wrapper is involved).
 * Initialises the server/edge SDK per runtime; the client SDK is initialised
 * from sentry.client.config.ts, imported by the root layout.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture router/handlers errors (404s excluded by the SDK) — no-op without a DSN.
export const onRequestError = Sentry.captureRequestError;
