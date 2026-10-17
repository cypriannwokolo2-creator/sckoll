# Sckoll — Product Plan (phases + milestones)

> **Provenance.** Rebuilt 2026-10-17. The original ~300-milestone draft was lost when local
> opencode storage was wiped (`rm -rf ~/.local/share/opencode ~/.config/opencode ~/.cache/opencode`);
> it was never committed to git. Phases 1–9 below are reconstructed **from git history and the
> running codebase**. Phases 10–20 are the rebuilt forward plan.
>
> **This file is now the single source of truth.** It lives in git on purpose. Update the checkbox
> in the *same commit* that finishes the milestone. Never mark `[x]` without evidence.

## How to use

- `- [ ]` open · `- [x]` done. **Done = evidence command passes, not intent.**
- A phase is "shipped" only when every milestone in it is `[x]` and its gate passes.
- One phase = one branch `feat/phaseN-<topic>` → one commit (or a small series) → merge → deploy.
- If a gate fails, stop. Never start the next phase with a red gate.

## Evidence commands (the gate for every phase)

```bash
cd backend && npm run lint && npx tsc --noEmit && npm test   # backend: lint, types, 47+ tests
cd .. && npx tsc --noEmit && npx eslint . && npx next build  # frontend: types, lint, build
docker compose ps                                            # stack healthy
```

---

## Status snapshot (2026-10-17)

| Phase | Topic | State |
|---|---|---|
| 1 | Frontend defects | ✅ shipped `12:05` |
| 2 | Backend API + auth hardening (never labelled in a commit) | ✅ shipped |
| 3 | Marketplace: opportunities | ✅ shipped `98c339d` |
| 4 | Applications: apply loop, pipeline | ✅ shipped `76310a3` |
| 5 | Talent side: search, shortlists, profiles | ✅ shipped `89da9b3` |
| 6 | Notifications: event bus, inbox, digest | ✅ shipped `85792da` |
| 7 | Contracts: milestones, messaging, reviews | ✅ shipped `6fb9e1e` |
| 8 | Payments: Paystack ledger, webhooks, release | ✅ shipped `dfb2b3a` |
| **9** | **Growth: semantic matching, telemetry, SEO** | ✅ shipped `afa8315` (deployed + verified 2026-10-17) |
| **10** | **Test & CI gate** | 🟡 CI green + merge gate enforced;1 milestone open (credentialed payments e2e) |
| 11–20 | Forward plan (below) | ⬜ not started |

---

# PART A — Reconstructed history (phases 1–9 shipped)

## Phase 1 — Frontend defects ✅
- [x] Copy, forms, links, metadata, contact-page fixes
- [x] Shared `Mark` brand component unified across auth pages
- [x] Landing-page navigation rebuilt; marketplace discovery added

## Phase 2 — Backend API, auth, security ✅ *(commit `1b7c10f` + `af50db7` + `94172f0`)*
- [x] Fastify + Drizzle backend: users, sessions, profiles, verification/password-reset tokens
- [x] Password auth + Google sign-in (ID-token flow) + Brevo transactional mail
- [x] Auth audit hardening: CVE patches, rate limits, security headers (helmet)
- [x] Frontend excluded from backend typecheck/lint/Vercel upload (`.vercelignore`)
- [x] Docker Compose stack: `api` + `db` (pgvector) + `redis`, Traefik labels, healthchecks

## Phase 3 — Marketplace ✅
- [x] Opportunities API: CRUD, cursor pagination, filters, categories
- [x] Migrations + seed data
- [x] Live discovery UI: `/find-work`, `/find-work/[id]`, `/categories/*`

## Phase 4 — Applications ✅
- [x] Apply loop with application state
- [x] Client pipeline UI `/pipeline`
- [x] Saved searches + `/proposal-assistant`

## Phase 5 — Talent side ✅
- [x] Talent search filters `/find-talent`
- [x] Shortlists API + UI, hiring room
- [x] Public profiles `/profile/[id]`, profile setup, owner edit form

## Phase 6 — Notifications ✅
- [x] Event bus + fan-out, notification prefs, digest
- [x] Inbox UI `/notifications` + one-click unsubscribe
- [x] In-app `NotifBell` component

## Phase 7 — Contracts ✅
- [x] Agreements, milestones, messages, reviews, auto-complete
- [x] Contract flags (`contract_flags`) + gating on reviews to completed contracts
- [x] `/contracts`, `/contracts/[id]` UI

## Phase 8 — Payments ✅
- [x] Paystack-first ledger (`payments` table), fund → release flow
- [x] `POST /v1/webhooks/paystack` with signature verification, fail-closed when key absent
- [x] Per-milestone fund/release, receipts, `/v1/contracts/:id/payments`

## Phase 9 — Growth ✅
- [x] `embeddings` + `match_events` migration `0007` (applied to dev DB)
- [x] Local 384-dim embedder behind a provider interface (`backend/src/lib/embeddings.ts`)
- [x] Hybrid re-rank on opportunities + talent search: 40% rules / 60% vector
- [x] Fit breakdown surfaced in UI: `% FIT` + `Why: …` reasons
- [x] `POST /v1/match-events` telemetry (view/click/apply) + `trackMatchEvent()` client
- [x] `db:embed` backfill script (ran: 30 opportunities, 2 profiles)
- [x] SEO routes: `/robots.txt`, `/sitemap.xml`, `/status`, `/success-stories`
- [x] Sitemap: dynamic `/find-work/[id]` + `/profile/[id]` URLs from the API (new `GET /v1/profiles` index, capped 300/collection, ISR daily; verified 55 URLs rendered)
- [x] Fire `click` match-event from feed cards (work feed + talent feed)
- [x] Remove dead `metadata.robots` export — robots intent moved to `layout.tsx`
- [x] Seed a second profile (`db:seed` → demo talent, idempotent, embedded on creation)
- [x] **Commit Phase 9 to `feat/phase9-growth` (this commit)** — gates: backend lint/types/47 tests, frontend lint/types/`next build`
- [x] **Push → merge to master → deploy → verify live** (evidence: `www.sckoll.com` `/sitemap.xml` + `/robots.txt` + `/status` + `/success-stories` all 200; sitemap = 55 URLs of which 32 dynamic; `api.sckoll.com/v1/profiles` 200; a listed opportunity and profile URL both 200)

---

# PART B — Forward plan

## Phase 10 — Test & CI gate
**Gate: a red PR cannot merge; frontend has real tests.**
- [x] Add Vitest to the frontend: component tests for the feed card + fit badge + ranking reasons (`OpportunityCard.tsx`, extracted from the feed so it is testable) 
- [x] Component test for the apply modal (`ApplyModal.tsx`, extracted from the detail page): pitch validation, submit payload, server rejection, cancel
- [x] React Testing Library coverage for auth forms (required/minlength wiring, server rejection, success navigation, role switch + consent)
- [x] Integration tests for `src/lib/api.ts`: request/error mapping, plus a **47-endpoint contract test** that fails if a route is renamed on one side only
- [x] Playwright smoke: home → find-work → opportunity detail → category page, sign-in/sign-up validation + real API rejection, robots/sitemap/status/success-stories (`e2e/*.spec.ts`, 10 passing)
- [x] Playwright apply flow written (`e2e/apply.spec.ts`) — gated on `E2E_EMAIL`/`E2E_PASSWORD` so CI never writes to shared data
- [ ] Playwright smoke: post project → contract → milestone → release (mocked Paystack) — needs the credentialed full-loop harness; partially covered by backend `contracts`/`payments` suites
- [x] `.github/workflows/ci.yml`: backend (lint/typecheck/test+coverage) + frontend (typecheck/lint/test+coverage/build) + e2e (full stack: pgvector service, API boot, seed, Playwright)
- [x] CI job installs only what it needs; npm caches via `setup-node` `cache: npm` with per-job `cache-dependency-path`
- [x] Backend coverage report (`vitest --coverage`) with a floor on `src/lib` (60/65/60/60) — frontend floor on `src/lib` too (75/70/75/75)
- [x] PR template: evidence commands pasted before review (`.github/pull_request_template.md`)
- [x] Branch protection: **PR required + 3 required status checks + `enforce_admins`** — verified by attempting a direct push to `master`, which GitHub rejected with `GH006: Changes must be made through a pull request /3 of 3 required status checks are expected` (owner included, no bypass)
- [x] `npm audit --audit-level=high` step in CI (non-blocking first, then blocking)
- [x] Badge in README showing CI status

**CI evidence (run `39060705737`, all ✅):**
- `Backend · lint, types, tests, coverage` — eslint (real config), `tsc`, 53 tests, coverage floors
- `Frontend · lint, types, tests, build` — `tsc`, eslint, 83 tests, `next build`
- `E2E · Playwright against a full stack` — pgvector service → API boot → seed → 10 Playwright specs

Three earlier failed runs each caught a real defect: backend lint was silently resolving the
**frontend** config (exited 2 locally — my greps had masked it), route suites assumed
`sckoll_test*` databases that only exist on an already-initialized machine, and
`NODE_ENV=development` on `next build` crashed prerendering (`useContext` null).

**Quality win while testing:** `trackMatchEvent` now swallows network rejections (was an unhandled promise rejection), the sign-up role switch gained real `role="tab"`/`aria-selected` semantics (was an invalid `tablist`), and `scoreVector: null` is now actually omitted from telemetry payloads.

## Phase 11 — Reliability & operations
**Gate: any machine can be rebuilt from docs; failures page you.**
- [x] **CORS origin policy fixed in production** — `api.sckoll.com` only allowed `http://localhost:3000`, so every browser call from `https://www.sckoll.com` was blocked (feed showed "Could not load opportunities"). Replaced with `isOriginAllowed()` (configured app URLs always, localhost only outside production) + `backend/src/lib/cors.test.ts` (6 tests). Evidence: prod feed now loads 12 cards with 0 CORS errors; `SITE_URL`/`FRONTEND_URL` on the serving box corrected to `https://www.sckoll.com` (they also drive email links).
- [ ] Nightly `pg_dump` cron into encrypted off-box storage (S3/rclone), 14-day retention
- [ ] Restore drill documented + scripted: `docs/runbooks/restore.md`, tested once
- [ ] Migration step in deploy: `drizzle-kit migrate` before app start, backward-compatible only
- [ ] Structured JSON request logging with request id; no secrets/PII in logs
- [ ] Sentry (or self-hosted GlitchTip) on backend + frontend, source maps uploaded
- [ ] Health endpoints: `/healthz` (live) + `/readyz` (db/redis reachable) wired to compose healthcheck
- [ ] Uptime monitor on `https://www.sckoll.com` + `https://api.sckoll.com` (5-min interval)
- [ ] Alert channel: email/Telegram on error-rate spike or failed deploy
- [ ] `/status` page fed by real checks instead of static copy
- [ ] Grafana/`prom-client` request metrics: latency p95, error rate, webhook failures
- [ ] Runbook: restart stack, rotate secrets, replay a failed Paystack webhook
- [ ] Document rollback: previous Vercel deployment + previous API image tag
- [ ] Staging environment (compose project + Vercel preview) that never touches prod data

## Phase 12 — Admin, moderation & disputes
**Gate: a flagged item can be resolved without touching the database.**
- [ ] `role` column on `users` (`user`/`moderator`/`admin`) + session carries role
- [ ] Admin auth guard middleware (`requireRole`), audited in `audit_log`
- [ ] `GET /v1/admin/*` endpoints: users, opportunities, contracts, flags, payments
- [ ] Admin UI `/admin`: queue of `contract_flags` with resolve/dismiss actions
- [ ] Dispute lifecycle: open → respond → decide → hold funds (extends `contract_flags`)
- [ ] Suspension/ban user: sessions revoked, listings hidden, reason recorded
- [ ] Opportunity moderation: report button + takedown + author notification
- [ ] Audit viewer: filter `audit_log` by actor, action, target, time
- [ ] Content policy page (`/rules`) linked from footer + report flows
- [ ] Seed an admin user via `db:seed` (idempotent, safe in dev)
- [ ] Tests: role gating, flag resolution, dispute state machine, ban revokes sessions
- [ ] E2E: admin resolves a flagged contract

## Phase 13 — Payments: production money
**Gate: test-mode E2E passes end-to-end; reconciliation proves ledger = Paystack.**
- [ ] Withdrawal/payout flow for talent (Paystack Transfers), idempotent + balance-checked
- [ ] Payout accounts: collect bank details, store masked, validate via Paystack recipient API
- [ ] Refunds on release failure/dispute, with ledger entries (never mutate history)
- [ ] Webhook idempotency: `paystack_event_id` unique key, replay-safe handlers
- [ ] Reconciliation job: compare `payments` rows against Paystack balance/transactions daily
- [ ] Receipts: PDF or HTML receipt per release, emailed via Brevo
- [ ] Currency/fee clarity in UI (platform fee breakdown before confirm)
- [ ] Rate-limited, retried webhook consumer with dead-letter log
- [ ] Tests: signature failure, duplicate webhook, insufficient balance, transfer failure
- [ ] Paystack test-mode E2E script committed under `backend/scripts/`
- [ ] Live-mode smoke test with a real ₦1 transaction, documented
- [ ] Ledger invariant test: sum(ledger) == platform balance at all times

## Phase 14 — Trust & safety
**Gate: a buyer can see why a talent is trustworthy, and bad actors get friction.**
- [ ] Identity verification badge (document/liveness via a vendor, or manual review queue)
- [ ] Skills assessments: short quizzes per category, score shown on profile
- [ ] Reference checks: request from past clients, verified via email link
- [ ] Work history import (LinkedIn/CV paste) with "unverified" labelling
- [ ] Profile completeness score + guided setup wizard (`/profile/setup` upgrade)
- [ ] Trust score v2: combines tenure, contracts completed, reviews, disputes, verification
- [ ] Fraud signals: shared device/IP between buyer and talent, payment anomalies, copy-paste spam
- [ ] Rate limits + CAPTCHA on signup, proposal spam throttling per account
- [ ] Review integrity: reviews only from completed contracts (already) + dispute-visibility rule
- [ ] Block/mute user; blocked pairs cannot message or apply
- [ ] Reporting flow with categories and moderator SLA counters
- [ ] Tests for trust score boundaries and fraud-signal rules

## Phase 15 — Search & discovery quality
**Gate: search relevance measurable; ranking changes backed by data.**
- [ ] Postgres full-text search (`tsvector` + `GIN`) for opportunities and profiles
- [ ] Trigram fallback for partial/skill-token queries
- [ ] Persisted ranking metrics: precision@10 sampled from `match_events`
- [ ] Ranking v2: learn weights from click/apply events (simple logistic regression, offline)
- [ ] Cold-start fix: seed profiles + richer seed opportunities for empty state
- [ ] Redis cache for feed first pages (short TTL) + cache invalidation on write
- [ ] Filter chips: type, budget, category, remote, experience, posted-within
- [ ] Sort modes: best fit / newest / budget, reflected in URL state
- [ ] Empty-state improvements: query suggestions + broaden-filters action
- [ ] Embeddings: hosted provider behind `EmbedProvider` (drop-in swap), backfill job
- [ ] A/B harness: rank variant per user, outcome logged to `match_events`
- [ ] Benchmarks recorded before/after (P50 latency + relevance sample)

## Phase 16 — Growth, SEO & lifecycle
**Gate: search engines index the real pages; a new visitor has a measurable path to signup.**
- [ ] JSON-LD structured data: `JobPosting` on opportunity pages, `ProfilePage` on talent pages
- [ ] Dynamic sitemap entries from API (open opportunities + public profiles, capped)
- [ ] Per-route metadata: unique title/description/canonical + OpenGraph image
- [ ] Generated OG images (next/og) per opportunity/category
- [ ] Analytics: Vercel Analytics or Plausible, funnels for visit → signup → apply → hire
- [ ] Event taxonomy documented (`docs/analytics.md`), no PII in payloads
- [ ] Email lifecycle: welcome → profile setup nudge → first application → weekly digest
- [ ] Digest email upgraded to personalized matches (uses embeddings, unsubscribe respected)
- [ ] Referral loop: invite rewards with tracked codes
- [ ] Keyword pages: category + "hire X" landing copy with real listings embedded
- [ ] RSS feed for new opportunities
- [ ] 404/500 pages on-brand with useful links
- [ ] Lighthouse ≥ 90 on home, find-work, sign-up (performance + a11y + SEO)
- [ ] `llms.txt` / robots policy reviewed; no secrets in HTML bundle

## Phase 17 — Performance & scale
**Gate: p95 under budget at 10× current seed load.**
- [ ] Load profile defined: target RPS for feed, detail, apply (k6 script committed)
- [ ] Baseline numbers recorded in `docs/perf-baseline.md`
- [ ] DB indexes verified against real query plans (`EXPLAIN ANALYZE` for feed/search/pipeline)
- [ ] N+1 sweeps: profile/embedding/badge fetches batched
- [ ] Pagination stress: deep cursors still fast
- [ ] API response compression + ETag/immutable caching for static assets
- [ ] Connection pooling (PgBouncer) for API containers
- [ ] Image pipeline: next/image sizing, AVIF, remote loader for user avatars
- [ ] Frontend bundle budget check in CI (fail on regression)
- [ ] Redis used for sessions/rate limits consistently; document eviction policy
- [ ] Horizontal API replicas behind Traefik + graceful shutdown (drain in-flight)
- [ ] Archive/aggregate old notifications, messages, match_events by age

## Phase 18 — Security, privacy & compliance
**Gate: external checklist green; secrets never in the repo.**
- [ ] Dependency audit clean (`npm audit`), Dependabot enabled
- [ ] Third-party pen-test checklist executed: OWASP Top 10 for API + web
- [ ] Secrets inventory + rotation runbook (AUTH_SECRET, Brevo, Paystack, DB)
- [ ] Secret scanning in CI (gitleaks) + pre-commit hook
- [ ] Rate-limit review per endpoint: auth, apply, message, contact, webhook
- [ ] CSRF strategy documented and verified for cookie-authenticated mutations
- [ ] Account takeover protections: password reset single-use, session invalidation on reset
- [ ] Privacy policy + terms written for real (NDPR/GDPR), data export + delete account flow
- [ ] Cookie/consent banner only if analytics require it
- [ ] Data retention schedule: purge expired sessions/tokens, anonymize deleted accounts
- [ ] CORS allowlist locked to production origins; no `*` with credentials
- [ ] Dependency/container base-image update cadence documented
- [ ] Security headers reviewed (CSP, HSTS, Permissions-Policy) + report-to endpoint
- [ ] Audit: PII returned by any endpoint (emails, phone, internal ids) — allowlist test

## Phase 19 — Mobile, accessibility & polish
**Gate: Lighthouse a11y ≥ 95; every core flow usable on a 360px screen.**
- [ ] Responsive audit of all 27 routes at 360px / 768px / 1280px
- [ ] Mobile navigation pattern (drawer) for feed and contract screens
- [ ] Touch targets ≥ 44px; tables become cards on small screens
- [ ] Keyboard-only pass: modals, apply flow, message composer, admin queue
- [ ] Focus rings visible, skip-link, correct heading order
- [ ] Screen-reader pass (VoiceOver/NVDA) on sign-up, apply, contract, checkout
- [ ] Color contrast audit on all badge/score colors
- [ ] Forms: inline validation, aria-describedby errors, no layout shift
- [ ] Skeletons for feed/profile loads; consistent empty states
- [ ] Dark-mode check (system preference) — no unreadable surfaces
- [ ] PWA manifest + icons + offline-friendly 404 (optional service worker)
- [ ] Browser matrix: Chrome, Safari, Firefox, Edge — smoke test recorded

## Phase 20 — Launch
**Gate: a stranger can sign up, get matched, apply, hire, and pay without you in the loop.**
- [ ] Production DNS/SSL verified for `www.sckoll.com`, `api.sckoll.com` (Traefik + LE)
- [ ] Production env audit: real secrets, `SITE_URL`/`API_URL` correct, dev mail off
- [ ] Seed data replaced with real content: 10 opportunities, 5 profiles, 3 stories
- [ ] Success stories written for real (Phase 9 page exists — fill it)
- [ ] Support channel: contact form → inbox verified, help/FAQ page, `support@` inbox
- [ ] Onboarding email sequence live end-to-end (Brevo, verified sender, SPF/DKIM)
- [ ] README rewritten for this project (it is still the create-next-app default)
- [ ] `docs/ARCHITECTURE.md`: services, data model, auth, payments, ranking
- [ ] `docs/API.md`: public endpoints + auth model
- [ ] Backup + restore drill re-run against production snapshot
- [ ] Incident process: who gets paged, severity definitions, comms template
- [ ] Pricing page live and accurate; fee math matches `Phase 13` implementation
- [ ] Legal pages reviewed; imprint/contact address present
- [ ] Launch checklist sign-off: all Phase gates green, `PLAN.md` fully `[x]`
- [ ] Public launch: show-and-tell post, directory submissions, first 10 real users onboarded manually

---

## Rules for future-you

1. **Commit the plan.** Every phase branch touches `PLAN.md` (check off its milestones).
2. **No phase overlap.** Finish + deploy + verify before starting the next branch.
3. **Gates are real.** If evidence commands fail, the milestone stays `[ ]`.
4. **Recovery.** This file is the only surviving copy of the roadmap — it is in git for a reason.
