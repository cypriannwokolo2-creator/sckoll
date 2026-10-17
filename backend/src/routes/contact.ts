import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Env } from "../env.js";
import { parseSender, sendBrevoEmail } from "../lib/brevo.js";
import { escapeHtml } from "../email/templates.js";

/**
 * Public contact form. Delivered to the site inbox via Brevo; when no inbox
 * or API key is configured the message is logged (dev) and accepted so the
 * form never dead-ends. Rate-limited against spam.
 */
export async function registerContactRoutes(app: FastifyInstance, env: Env): Promise<void> {
  app.post(
    "/v1/contact",
    { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } },
    async (request, reply) => {
      const parsed = z
        .object({
          name: z.string().trim().min(1).max(120),
          email: z.string().email().max(254),
          topic: z.enum(["talent", "team", "partner"]).default("talent"),
          message: z.string().trim().min(10).max(5000),
        })
        .safeParse(request.body);
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ error: "invalid_request", message: parsed.error.issues[0]?.message ?? "Invalid input." });
      }
      const inbox = env.CONTACT_TO || env.BREVO_FROM_HELLO;
      const { name, email, topic, message } = parsed.data;
      const html = `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt; wrote about <strong>${escapeHtml(topic)}</strong>:</p><p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>`;
      if (!env.BREVO_API_KEY) {
        if (env.NODE_ENV !== "production") {
          console.log(`[contact:off] from=${email} topic=${topic} message=${message.slice(0, 120)}`);
        }
        return reply.send({ ok: true });
      }
      const ok = await sendBrevoEmail({
        apiKey: env.BREVO_API_KEY,
        sender: "hello",
        senderOverride: parseSender(env.BREVO_FROM_HELLO),
        securityFrom: env.BREVO_FROM_SECURITY,
        helloFrom: env.BREVO_FROM_HELLO,
        to: [parseSender(inbox)],
        subject: `[sckoll contact/${topic}] ${name}`,
        html,
        tags: ["contact"],
      });
      if (!ok) return reply.code(502).send({ error: "delivery_failed", message: "Could not deliver your message. Try again shortly." });
      return reply.send({ ok: true });
    },
  );
}
