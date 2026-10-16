/** Sckoll transactional email templates — lime CTA, 600px table shell. */

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(content: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>Sckoll</title></head>
<body style="margin:0;padding:0;background:#f1f6e9;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f6e9;">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;">
<tr><td style="background:#0b0c0e;border-radius:14px 14px 0 0;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:3px;color:#ffffff;">SCKOLL</td></tr>
<tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#0b0c0e;">${content}</td></tr>
</table></td></tr></table></body></html>`;
}

function cta(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 8px;"><tr><td align="center" bgcolor="#a3ff00" style="border-radius:999px;"><a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:bold;color:#0b0c0e;text-decoration:none;border-radius:999px;">${label}</a></td></tr></table>`;
}

export function verifyEmailTemplate(input: { name?: string | null; actionUrl: string }): { subject: string; html: string } {
  const name = escapeHtml(input.name?.trim() || "there");
  return {
    subject: "Confirm your Sckoll account",
    html: shell(
      `<p style="margin:0 0 16px;">Hi ${name},</p><p style="margin:0 0 16px;">Confirm your email to activate your Sckoll workspace. This link expires in 60 minutes.</p>${cta(input.actionUrl, "Confirm my account")}<p style="color:#5b6470;font-size:14px;">If you did not create this account, ignore this email.</p>`,
    ),
  };
}

export function welcomeTemplate(input: { name?: string | null; role: string; appUrl: string }): { subject: string; html: string } {
  const name = escapeHtml(input.name?.trim() || "there");
  const next = input.role === "client" ? "Post your first project or search talent." : "Complete your profile and review your matches.";
  return {
    subject: "Welcome to Sckoll — let's move work forward",
    html: shell(
      `<p style="margin:0 0 16px;">Welcome, ${name}.</p><p style="margin:0 0 16px;">Your account is confirmed. ${escapeHtml(next)}</p>${cta(input.appUrl, "Open Sckoll")}`,
    ),
  };
}

export function resetPasswordTemplate(input: { actionUrl: string }): { subject: string; html: string } {
  return {
    subject: "Reset your Sckoll password",
    html: shell(
      `<p style="margin:0 0 16px;">We received a password reset request for your Sckoll account. This link expires in 60 minutes.</p>${cta(input.actionUrl, "Reset my password")}<p style="color:#5b6470;font-size:14px;">If you did not request this, ignore this email.</p>`,
    ),
  };
}
