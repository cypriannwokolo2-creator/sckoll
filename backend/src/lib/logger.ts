import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import type { FastifyServerOptions } from "fastify";

type LoggerOpts = Exclude<NonNullable<FastifyServerOptions["logger"]>, boolean>;

/**
 * Structured request logging.
 *
 * - JSON lines in every non-test environment (log drains parse them).
 * - Serializers emit only id/method/url/ip and statusCode: headers (cookies,
 *   authorization) and bodies (passwords, pitches) are never serialized, so
 *   they cannot leak into log storage. Redact paths cover hand-built objects.
 * - Every response carries `x-request-id` (honouring an inbound one), so a
 *   user-reported error can be traced to its exact request line.
 */
export function loggerOptions(level?: string): LoggerOpts {
  return {
    level: level || "info",
    redact: {
      paths: ["req.headers", "res.headers", "req.body", "*.password", "*.token", "*.idToken"],
      censor: "[redacted]",
    },
    serializers: {
      req(req: { id?: unknown; method?: string; url?: string; ip?: string }) {
        return { id: req.id, method: req.method, url: req.url, ip: req.ip };
      },
      res(res: { statusCode?: number }) {
        return { statusCode: res.statusCode };
      },
    },
  };
}

/** Correlation id: honour a sane inbound `x-request-id`, otherwise mint one. */
export function genReqId(req: IncomingMessage): string {
  const incoming = req.headers["x-request-id"];
  if (typeof incoming === "string" && /^[\w.:/+=-]{1,64}$/.test(incoming)) return incoming;
  return randomUUID();
}
