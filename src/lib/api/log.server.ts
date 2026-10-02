import { clientIp, rateLimited } from "./ratelimit.server";

// Receives browser errors from /monitor.js and writes them to the server log (Vercel → Logs),
// so front-end failures are visible without a third-party service. To use Sentry instead, load
// its SDK in monitor.js and keep this as a fallback.

const cut = (v: unknown, n: number) =>
  String(v ?? "")
    .replace(/[\r\n]+/g, " ")
    .slice(0, n);

export async function handleLog(request: Request): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405 });
  if (await rateLimited(`log:${clientIp(request)}`, 20, 60_000))
    return new Response(null, { status: 429 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096)
    return new Response(null, { status: 413 });
  try {
    const b = (await request.json()) as Record<string, unknown>;
    console.error(
      `[client-error] ${cut(b.message, 300)} | ${cut(b.source, 200)}:${cut(b.line, 8)}:${cut(b.col, 8)} | page=${cut(b.page, 200)} | ua=${cut(request.headers.get("user-agent"), 120)}`,
    );
  } catch {
    /* ignore malformed reports */
  }
  return new Response(null, { status: 204 });
}
