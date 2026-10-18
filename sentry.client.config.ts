import * as Sentry from "@sentry/nextjs";

// Client-side error tracking (Sentry-compatible, self-hosted GlitchTip).
// DSN-driven: with NEXT_PUBLIC_SENTRY_DSN unset (CI, most builds) the SDK is
// never initialised and nothing is sent anywhere.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: 0.1,
    maxValueLength: 500, // keep long user content out of events
  });
}
