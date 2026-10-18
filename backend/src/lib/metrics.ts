import {
  Counter,
  Histogram,
  Registry,
  collectDefaultMetrics,
} from "prom-client";

/**
 * Prometheus request metrics. A dedicated registry keeps us isolated from the
 * global default one (safe under repeated buildServer() calls in tests), and
 * every metric is defined exactly once at module load.
 *
 * Label discipline: `route` is the registered route pattern (e.g.
 * `/v1/opportunities/:id`), never the concrete path — unknown URLs collapse to
 * `unmatched`, so cardinality stays bounded by the route table.
 */
export const registry = new Registry();

export const httpRequestsTotal = new Counter({
  name: "sckoll_http_requests_total",
  help: "HTTP requests by route, method and status code",
  labelNames: ["method", "route", "status"],
  registers: [registry],
});

export const httpRequestDuration = new Histogram({
  name: "sckoll_http_request_duration_seconds",
  help: "HTTP request latency by route, method and status code",
  labelNames: ["method", "route", "status"],
  buckets: [0.005, 0.025, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

let defaultsStarted = false;

/** Start default process/Node metrics once; skipped in tests (no timers there). */
export function initMetrics(nodeEnv: string): void {
  if (defaultsStarted || nodeEnv === "test") return;
  defaultsStarted = true;
  collectDefaultMetrics({ register: registry });
}

export function observeRequest(
  method: string,
  route: string | undefined,
  status: number,
  durationSeconds: number,
): void {
  const labels = {
    method,
    route: route ?? "unmatched",
    status: String(status),
  };
  httpRequestsTotal.inc(labels);
  httpRequestDuration.observe(labels, durationSeconds);
}
