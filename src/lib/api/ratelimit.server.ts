// Rate limiting. Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL / _TOKEN are set, so the
// limit is shared across all serverless instances. Otherwise falls back to an in-memory window
// (per instance: good enough to blunt a single bot, not a distributed attack).

const memory = new Map<string, number[]>();

function memoryLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (memory.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  memory.set(key, recent);
  if (memory.size > 5000)
    for (const [k, v] of memory) if (!v.some((t) => now - t < windowMs)) memory.delete(k);
  return recent.length > max;
}

/** True when the caller has exceeded `max` requests per `windowMs`. Never throws. */
export async function rateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return memoryLimited(key, max, windowMs);
  try {
    const k = `rl:${key}`;
    const res = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", k],
        ["PEXPIRE", k, windowMs, "NX"],
      ]),
    });
    const data = (await res.json()) as Array<{ result?: number }>;
    return (data?.[0]?.result ?? 0) > max;
  } catch (err) {
    console.error(
      "[ratelimit] upstash failed, using memory:",
      err instanceof Error ? err.message : err,
    );
    return memoryLimited(key, max, windowMs);
  }
}

/** Best-effort client IP behind Vercel / proxies. */
export function clientIp(request: Request): string {
  return (request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown")
    .split(",")[0]
    .trim();
}
