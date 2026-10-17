# Runbook — rollback

Two halves ship independently: the **frontend** (Vercel, auto-deploys `master`) and the
**API** (Docker image built on the host box). Roll back whichever is bad.

## Policy: roll the app back, never the schema

Migrations are applied **before** the server accepts traffic (container CMD, `npm start`) and
must be backward-compatible with the previous app version — *expand → migrate → contract*.
So rolling back the app is always safe with the current schema. A migration that needs
undoing gets a **new forward migration**; never hand-edit or delete rows in
`__drizzle_migrations`, and never `ALTER` production by hand.

## 1. Identify the last good version

```bash
gh api 'repos/cypriannwokolo2-creator/sckoll/deployments?environment=Production' \
  --jq '.[] | .created_at + " " + .sha[0:7]' | head -5   # what shipped, newest first
git log --oneline -10
```

## 2. Roll back the frontend (Vercel)

Dashboard → project **sckoll** → **Deployments** → the last deployment that was healthy →
**⋯ → Promote to Production**. Takes effect immediately; the next `master` push will
overwrite it, so if the bad change is still on `master`, fix-forward or revert in git too:

```bash
git revert <bad-sha> && git push origin master   # redeploys a clean build
```

## 3. Roll back the API (host box)

Images are built from the checkout, so "previous image" = previous git state:

```bash
git fetch origin && git checkout <last-good-sha>
docker compose up -d --build api
curl -s http://127.0.0.1:8110/readyz | jq .status    # expect "ready"
```

Leave the box on the good commit until a real fix lands; record it:

```bash
git tag rollback-point-$(date +%Y%m%d) && git push -f origin rollback-point-$(date +%Y%m%d)
```

Then, when the fix ships: `git checkout master && docker compose up -d --build api`.

## 4. Verify

- `https://www.sckoll.com/status` — every check green.
- One real user flow (sign-in, open an opportunity) in a browser, not just `curl`.
- `docker compose logs api | tail -30` — no error storm after the swap.

## When rollback doesn't help

If the bug is data (bad rows, wrong balances), stop and restore from backup instead — see
[restore.md](./restore.md) once nightly backups exist (Phase 11 backup milestone). For
user-visible incidents, post the facts on the status page while you work.
