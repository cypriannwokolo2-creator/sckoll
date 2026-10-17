## What changed

<!-- One or two sentences. Link the PLAN.md phase/milestone this closes. -->

## Evidence

Run these before requesting review and paste the tail of each output:

```bash
cd backend && npm run lint && npx tsc --noEmit && npm run test:coverage
cd .. && npx tsc --noEmit && npx eslint . && npm run test:coverage && npx next build
NEXT_PUBLIC_API_URL=http://127.0.0.1:8110 npx next build && npm run test:e2e
docker compose ps
```

- [ ] Backend gate green (lint, types, tests + coverage floor)
- [ ] Frontend gate green (types, lint, tests + coverage floor, build)
- [ ] E2E green (`npm run test:e2e`), or explained why it could not run
- [ ] `PLAN.md` milestones ticked in **this** commit
- [ ] No secrets, `.env` contents, or PII added
- [ ] New/changed endpoints have tests; new UI has a unit or e2e test
- [ ] Migrations are append-only and backward-compatible

## Risk & rollback

<!-- What breaks if this is wrong, and how to revert (commit / image tag / Vercel rollback). -->

## Screenshots

<!-- UI changes only. -->
