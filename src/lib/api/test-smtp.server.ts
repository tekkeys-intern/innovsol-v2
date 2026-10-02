import nodemailer from "nodemailer";

// Diagnostic endpoint. It used to be public, which leaked the SMTP host/user and let anyone trigger
// emails. It is now OFF unless ADMIN_TOKEN is set, and requires `x-admin-token: <ADMIN_TOKEN>`.

const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
};

export async function handleTestSmtp(request: Request): Promise<Response> {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return new Response("Not found", { status: 404 });
  if (!safeEqual(request.headers.get("x-admin-token") ?? "", adminToken))
    return new Response("Forbidden", { status: 403 });

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM ?? "noreply@innovsol.ai";
  const smtpTo = process.env.SMTP_TO ?? "hello@innovsol.ai";

  if (!smtpHost || !smtpUser || !smtpPass) {
    return Response.json({
      ok: false,
      step: "env",
      missing: [
        !smtpHost && "SMTP_HOST",
        !smtpUser && "SMTP_USER",
        !smtpPass && "SMTP_PASS",
      ].filter(Boolean),
    });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    requireTLS: true,
    auth: { user: smtpUser, pass: smtpPass },
  });

  try {
    await transporter.verify();
  } catch (err) {
    return Response.json({
      ok: false,
      step: "verify",
      error: err instanceof Error ? err.message : String(err),
    });
  }
  try {
    const info = await transporter.sendMail({
      from: `"Innovsol Test" <${smtpFrom}>`,
      to: smtpTo,
      subject: "SMTP test — Innovsol",
      text: `Test email sent to ${smtpTo} from ${smtpFrom}.`,
    });
    return Response.json({
      ok: true,
      step: "sent",
      messageId: info.messageId,
      note: `Check ${smtpTo} (and spam).`,
    });
  } catch (err) {
    return Response.json({
      ok: false,
      step: "sendMail",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
