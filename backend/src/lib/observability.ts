import * as Sentry from "@sentry/node";

/**
 * Error tracking against Sentry or a self-hosted GlitchTip (SDK-compatible).
 * Everything is DSN-driven: with no SENTRY_DSN configured the SDK is never
 * initialised, nothing is captured, and no network I/O happens (tests, CI).
 */
export function initSentry(dsn: string, environment: string, release = ""): boolean {
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment,
    release: release || undefined,
    tracesSampleRate: 0.1,
    maxValueLength: 500, // keep long user content (pitches, messages) out of events
  });
  return true;
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  Sentry.captureException(err, context ? { extra: context } : undefined);
}
