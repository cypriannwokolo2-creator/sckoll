import * as Sentry from "@sentry/nextjs";

// Server-side error tracking. Uses SENTRY_DSN (private, server bundles only)
// with NEXT_PUBLIC_SENTRY_DSN as fallback so one Vercel env var suffices.
// DSN-driven: unset means the SDK is never initialised (CI, tests).
const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,
    maxValueLength: 500,
  });
}
