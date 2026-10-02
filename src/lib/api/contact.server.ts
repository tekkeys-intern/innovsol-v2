import nodemailer from "nodemailer";
import { esc, oneLine, validateEnquiry, type Enquiry } from "./validate";
import { clientIp, rateLimited } from "./ratelimit.server";
import { turnstileEnabled, verifyTurnstile } from "./turnstile.server";

// ── What this endpoint does ───────────────────────────────────────────────
// 1. validates + sanitises input (see validate.ts; unit-tested)
// 2. blocks bots: honeypot, optional Cloudflare Turnstile, per-IP rate limit, same-origin check
// 3. stores the enquiry in Supabase `enquiries` (if configured) – never blocks the email on failure
// 4. emails the team (SMTP), optionally auto-replies to the sender, optionally forwards to a CRM webhook
// Secrets only come from environment variables.

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    requireTLS: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function storeEnquiry(v: Enquiry): Promise<void> {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  try {
    const res = await fetch(`${url}/rest/v1/enquiries`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        first_name: v.firstName,
        last_name: v.lastName,
        email: v.email,
        phone: v.phone || null,
        company: v.company,
        industry: v.industry || null,
        enquiry_type: v.enquiryType || null,
        message: v.message || null,
        kind: v.kind,
      }),
    });
    if (!res.ok)
      console.error(
        "[contact] enquiry store failed:",
        res.status,
        (await res.text()).slice(0, 200),
      );
  } catch (err) {
    console.error("[contact] enquiry store error:", err instanceof Error ? err.message : err);
  }
}

async function forwardToCrm(v: Enquiry): Promise<void> {
  const hook = process.env.CRM_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.CRM_WEBHOOK_TOKEN
          ? { Authorization: `Bearer ${process.env.CRM_WEBHOOK_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ source: "innovsol.ai", receivedAt: new Date().toISOString(), ...v }),
    });
  } catch (err) {
    console.error("[contact] CRM webhook failed:", err instanceof Error ? err.message : err);
  }
}

const row = (label: string, value: string, html = "") =>
  `<div class="field" style="flex:1;min-width:160px"><div class="label">${label}</div><div class="value">${html || esc(value) || "—"}</div></div>`;

function teamEmail(v: Enquiry): string {
  const title = v.kind === "playbook" ? "New Playbook Request" : "New Website Enquiry";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
body{font-family:Arial,sans-serif;color:#0f1923;background:#f8f9fc;margin:0;padding:0}
.wrap{max-width:600px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.header{background:#3f6cb5;padding:28px 32px}.header h1{color:#fff;margin:0;font-size:20px}.header p{color:rgba(255,255,255,.75);margin:4px 0 0;font-size:13px}
.body{padding:28px 32px}.field{margin-bottom:18px}.label{font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#5a6a7a;margin-bottom:4px}
.value{font-size:15px}.divider{height:1px;background:#e8eef7;margin:20px 0}
.message-box{background:#f8f9fc;border-left:3px solid #faa720;padding:14px 16px;border-radius:4px;font-size:14px;line-height:1.6;white-space:pre-wrap}
.footer{background:#f8f9fc;padding:16px 32px;border-top:1px solid #e8eef7;font-size:12px;color:#8fa3b8}
</style></head><body><div class="wrap">
<div class="header"><h1>${title}</h1><p>Submitted via innovsol.ai</p></div>
<div class="body">
<div style="display:flex;gap:24px;flex-wrap:wrap">${row("Name", `${v.firstName} ${v.lastName}`)}${row("Company", v.company)}</div>
<div style="display:flex;gap:24px;flex-wrap:wrap">${row("Work Email", v.email, `<a href="mailto:${esc(v.email)}" style="color:#3f6cb5">${esc(v.email)}</a>`)}${row("Phone", v.phone)}</div>
<div style="display:flex;gap:24px;flex-wrap:wrap">${row("Industry", v.industry)}${row("Enquiry Type", v.enquiryType)}</div>
<div class="divider"></div>
<div class="field"><div class="label">Message</div><div class="message-box">${esc(v.message) || "(no message provided)"}</div></div>
</div><div class="footer">Sent automatically from the Innovsol website.</div></div></body></html>`;
}

/** Deliberately echoes no user-supplied text: an attacker cannot use it to send content to a victim. */
const autoReply = (first: string) =>
  `<p>Hi ${esc(first)},</p><p>Thank you for contacting Innovsol. We have received your message and a member of our team will reply within one business day.</p><p>— The Innovsol team<br><a href="https://innovsol.ai">innovsol.ai</a></p><p style="color:#888;font-size:12px">If you did not make this request, you can ignore this email.</p>`;

export async function handleContactRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // Same-origin check. Behind Vercel's proxy the request URL can carry an internal host, so accept
  // the host the browser actually used (Host / X-Forwarded-Host) and the configured SITE_URL too.
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const allowed = new Set<string>(
        [
          new URL(request.url).host,
          request.headers.get("host"),
          request.headers.get("x-forwarded-host"),
          process.env.SITE_URL ? new URL(process.env.SITE_URL).host : null,
          process.env.VERCEL_URL ?? null,
          process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
        ].filter((h): h is string => Boolean(h)),
      );
      if (!allowed.has(new URL(origin).host)) return json({ error: "Forbidden" }, 403);
    } catch {
      return json({ error: "Forbidden" }, 403);
    }
  }

  const ip = clientIp(request);
  if (await rateLimited(`contact:${ip}`, 5, 10 * 60 * 1000))
    return json({ error: "Too many requests. Please try again in a few minutes." }, 429);

  if (Number(request.headers.get("content-length") ?? 0) > 32_768)
    return json({ error: "Request too large" }, 413);

  let raw: Record<string, unknown>;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, 400);
  }

  const result = validateEnquiry(raw);
  if (!result.ok) return json({ error: result.error }, 400);
  if (result.honeypot) return json({ success: true }); // pretend success to bots

  if (turnstileEnabled() && !(await verifyTurnstile(String(raw.turnstileToken ?? ""), ip)))
    return json({ error: "Please complete the verification and try again." }, 400);

  const v = result.value;
  const smtpFrom = process.env.SMTP_FROM ?? "noreply@innovsol.ai";
  const smtpTo = process.env.SMTP_TO ?? "hello@innovsol.ai";

  // Store first (independent of email) so a lead is never lost to an SMTP outage.
  await storeEnquiry(v);
  void forwardToCrm(v);

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("[contact] Missing SMTP env vars");
    return json({ error: "Email service not configured. Please contact us at " + smtpTo }, 500);
  }

  try {
    const transporter = getTransporter();
    const fromName = oneLine(process.env.SMTP_FROM_NAME ?? "Innovsol Website");
    const info = await transporter.sendMail({
      from: `"${fromName}" <${smtpFrom}>`,
      to: smtpTo,
      replyTo: v.email,
      subject: oneLine(
        `${v.kind === "playbook" ? "Playbook request" : "New Enquiry"}: ${v.firstName} ${v.lastName} — ${v.company}`,
      ).slice(0, 200),
      html: teamEmail(v),
    });
    console.log("[contact] sent", info.messageId);
    if (process.env.AUTO_REPLY !== "0") {
      transporter
        .sendMail({
          from: `"Innovsol" <${smtpFrom}>`,
          to: v.email,
          subject: "We received your message — Innovsol",
          html: autoReply(v.firstName),
        })
        .catch((e: unknown) =>
          console.error("[contact] auto-reply failed:", e instanceof Error ? e.message : e),
        );
    }
  } catch (err) {
    console.error("[contact] SMTP error:", err instanceof Error ? err.message : err);
    return json({ error: "Failed to send email. Please contact us at " + smtpTo }, 500);
  }

  return json({ success: true });
}
