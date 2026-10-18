# Runbook — metrics & dashboards (prom-client + Prometheus + Grafana)

Three pieces, all in `docker-compose.yml`, all scraping/serving over the
**internal** network only:

| service     | image                     | bind                | purpose                       |
| ----------- | ------------------------- | ------------------- | ----------------------------- |
| `api`       | —                         | `/metrics` route    | prom-client metrics           |
| `prometheus` | `prom/prometheus:v3.13.4` | `127.0.0.1:9090`    | 15s scrapes, 15d retention    |
| `grafana`   | `grafana/grafana:13.2.4`  | `127.0.0.1:8130`    | dashboards (provisioned)      |

- **Access**: SSH tunnel (`ssh -L 8130:127.0.0.1:8130 <box>` →
  http://localhost:8130). Admin creds in `.env.observability` (gitignored).
- **`/metrics` is not public**: the Traefik router rule is
  `Host(api.sckoll.com) && !Path(/metrics)` → external 404, internal scrape
  over `http://api:8110/metrics`. (Verified: `api.sckoll.com/metrics` → 404,
  `api.sckoll.com/healthz` → 200.)

## Metrics exposed (`backend/src/lib/metrics.ts`)

- `sckoll_http_requests_total{method,route,status}` — counter
- `sckoll_http_request_duration_seconds{method,route,status}` — histogram
  (buckets 5 ms … 10 s; the p95/p50/p99 panels derive from it)
- default `process_*`/`nodejs_*` metrics (skipped under `NODE_ENV=test` so
  tests never start timers)

Label discipline: `route` is the **registered pattern**
(`/v1/opportunities/:id`), unknown URLs collapse to `unmatched` — cardinality
is bounded by the route table. Webhook failures are the
`route="/v1/webhooks/paystack"` series filtered to 4xx/5xx.

## Dashboard

`deploy/grafana/dashboards/api-overview.json` (provisioned, read-only):
request rate by route · 5xx error rate · latency p95 by route · p50/p95/p99 ·
Paystack webhook failures · API process RSS. Source files live in
`deploy/grafana/provisioning/` (datasource + provider) and
`deploy/prometheus/prometheus.yml` (scrape config) — all committed.

## Verify a deployment

```bash
curl -s localhost:8110/metrics | grep -c '^sckoll_'        # endpoint serves
curl -s localhost:9090/api/v1/targets | jq .data.activeTargets[].health  # "up"
curl -s --get localhost:9090/api/v1/query \
  --data-urlencode 'query=histogram_quantile(0.95, sum by (le) (rate(sckoll_http_request_duration_seconds_bucket[5m])))'
```

## Incident use

- Error-rate spike → panel 2, then `docker compose logs api` (correlate with
  `x-request-id` from the user report), then [alerting.md](./alerting.md).
- Data retention: 15d on the box (`prometheus-data` volume). Alerting on
  these metrics (Grafana alerting → Brevo) is intentionally deferred until
  the Brevo key exists — the sentinel already covers endpoint-level failure.
