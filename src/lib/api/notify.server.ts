import nodemailer from "nodemailer";
import { esc, oneLine } from "./validate";

// Supabase Database Webhook target → emails for the portal:
//   applications INSERT  → recruiters (SMTP_TO) get "new application"
//   applications UPDATE (status changed) → the candidate gets a status update
// Setup (Supabase → Database → Webhooks): table `applications`, events Insert + Update, method POST,
// URL https://YOUR-DOMAIN/api/notify, header  x-webhook-secret: <NOTIFY_SECRET>.
// Server-only env: NOTIFY_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (never exposed to the browser).

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

const STATUS_TEXT: Record<string, string> = {
  in_review: "is now being reviewed",
  interview: "has moved to the interview stage",
  offer: "has received an offer decision — we will contact you shortly",
  rejected: "was not taken forward on this occasion. Thank you for your interest in Innovsol",
  withdrawn: "has been withdrawn",
};

async function sb(path: string): Promise<unknown[]> {
  const url = process.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set");
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`supabase ${res.status}`);
  return (await res.json()) as unknown[];
}

export async function handleNotify(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return new Response("Not configured", { status: 503 });
  if (!safeEqual(request.headers.get("x-webhook-secret") ?? "", secret))
    return new Response("Forbidden", { status: 403 });

  const payload = (await request.json().catch(() => null)) as {
    type?: string;
    table?: string;
    record?: { job_id?: string; applicant_id?: string; status?: string };
    old_record?: { status?: string };
  } | null;
  if (!payload || payload.table !== "applications" || !payload.record)
    return new Response(null, { status: 204 });
  const r = payload.record;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS)
    return new Response("SMTP not configured", { status: 503 });

  try {
    const [job] = (await sb(
      `jobs?select=title&id=eq.${encodeURIComponent(r.job_id ?? "")}`,
    )) as Array<{ title: string }>;
    const [who] = (await sb(
      `profiles?select=email,full_name&id=eq.${encodeURIComponent(r.applicant_id ?? "")}`,
    )) as Array<{ email: string; full_name: string | null }>;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      requireTLS: true,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    const from = `"Innovsol Careers" <${process.env.SMTP_FROM ?? "noreply@innovsol.ai"}>`;

    if (payload.type === "INSERT") {
      await transporter.sendMail({
        from,
        to: process.env.SMTP_TO ?? "hello@innovsol.ai",
        subject: oneLine(
          `New application: ${job?.title ?? "role"} — ${who?.full_name || who?.email}`,
        ).slice(0, 200),
        html: `<p>${esc(who?.full_name || who?.email || "A candidate")} applied for <b>${esc(job?.title ?? "a role")}</b>.</p><p>Open the portal to review: <a href="https://innovsol.ai/portal">innovsol.ai/portal</a></p>`,
      });
    } else if (
      payload.type === "UPDATE" &&
      r.status &&
      r.status !== payload.old_record?.status &&
      STATUS_TEXT[r.status] &&
      who?.email
    ) {
      await transporter.sendMail({
        from,
        to: who.email,
        subject: oneLine(`Your application: ${job?.title ?? "update"}`).slice(0, 200),
        html: `<p>Hi ${esc(who.full_name?.split(" ")[0] || "there")},</p><p>Your application for <b>${esc(job?.title ?? "the role")}</b> ${STATUS_TEXT[r.status]}.</p><p>You can follow progress any time at <a href="https://innovsol.ai/portal">innovsol.ai/portal</a>.</p><p>— Innovsol Talent Team</p>`,
      });
    }
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[notify] failed:", err instanceof Error ? err.message : err);
    return new Response("Error", { status: 500 });
  }
}
