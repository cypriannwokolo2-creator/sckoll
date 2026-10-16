/**
 * Sckoll Brevo transactional email client.
 * One verified sender per purpose (verify these on sckoll.com in Brevo):
 * - security: no-reply@ — verification, password reset, security notices
 * - hello:    hello@     — welcome + onboarding
 * `fetchImpl` is injectable so sending is unit-testable without keys.
 */

const BASE = "https://api.brevo.com/v3";

export type FetchImpl = typeof fetch;

export type SenderKind = "security" | "hello";

export interface ParsedSender {
  name: string;
  email: string;
}

export function parseSender(raw: string): ParsedSender {
  const match = raw.match(/^(.*)<([^>]+)>$/);
  if (match) {
    return { name: match[1].trim() || "Sckoll", email: match[2].trim() };
  }
  return { name: "Sckoll", email: raw.trim() };
}

export interface BrevoEmail {
  apiKey: string;
  sender: SenderKind;
  senderOverride?: ParsedSender;
  securityFrom: string;
  helloFrom: string;
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
  text?: string;
  tags?: string[];
  fetchImpl?: FetchImpl;
}

export function resolveSender(input: Pick<BrevoEmail, "sender" | "senderOverride" | "securityFrom" | "helloFrom">): ParsedSender {
  if (input.senderOverride) return input.senderOverride;
  return parseSender(input.sender === "security" ? input.securityFrom : input.helloFrom);
}

export async function sendBrevoEmail(input: BrevoEmail): Promise<boolean> {
  if (!input.apiKey) return false;
  const sender = resolveSender(input);
  try {
    const res = await (input.fetchImpl ?? fetch)(`${BASE}/smtp/email`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": input.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender,
        to: input.to,
        subject: input.subject,
        htmlContent: input.html,
        ...(input.text ? { textContent: input.text } : {}),
        ...(input.tags ? { tags: input.tags } : {}),
      }),
    });
    return res.status === 201 || res.ok;
  } catch {
    return false;
  }
}
