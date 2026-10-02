// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// ── Deployment (Vercel) ───────────────────────────────────────────────────────
// `nitro.preset: "vercel"` makes `vite build` emit the Vercel Build Output (.vercel/output):
// static files from /public plus one Node serverless function that renders pages and serves /api/*.
// Environment variables are read at build time (VITE_*) and request time (server secrets).
const env = { ...loadEnv("production", process.cwd(), "VITE_"), ...process.env };

// Allow the browser to talk to YOUR Supabase project (taken from the environment, never hard-coded).
let supabaseOrigins = "";
try {
  if (env.VITE_SUPABASE_URL) {
    const u = new URL(env.VITE_SUPABASE_URL);
    supabaseOrigins = ` ${u.origin} wss://${u.host}`;
  }
} catch {
  /* invalid URL: leave Supabase out of the policy */
}

// Security headers (production only). The page scripts/styles are injected inline by the app shell,
// hence 'unsafe-inline' for scripts (tracked in docs/GAPS.md E7). Everything else is same-origin plus
// the few third parties the site uses.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://www.googletagmanager.com https://plausible.io",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: https://images.unsplash.com https://www.google-analytics.com https://*.googletagmanager.com",
  "media-src 'self'",
  `connect-src 'self'${supabaseOrigins} https://*.google-analytics.com https://*.analytics.google.com https://plausible.io`,
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = {
  "Content-Security-Policy": csp,
  // 1 year, no includeSubDomains/preload yet: only add those once every subdomain is HTTPS-only.
  "Strict-Transport-Security": "max-age=31536000",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), interest-cohort=()",
  "Cross-Origin-Opener-Policy": "same-origin",
};

const longCache = { "Cache-Control": "public, max-age=2592000, stale-while-revalidate=86400" };
// Generated CSS/JS keeps its file name between releases, so cache briefly and revalidate.
const shortCache = { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" };

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // routeRules is a valid nitro option; the wrapper's type just does not declare it, hence the cast.
  // (The function region is set in scripts/fix-vercel-output.cjs.)
  nitro: {
    preset: "vercel",
    routeRules: {
      "/**": { headers: securityHeaders },
      "/media/**": { headers: longCache },
      "/images/**": { headers: longCache },
      "/industries/assets/**": { headers: longCache },
      "/careers/assets/**": { headers: longCache },
      "/shell/**": { headers: shortCache },
      "/pages/**": { headers: shortCache },
      "/industries/industry.css": { headers: shortCache },
      "/industries/industry.js": { headers: shortCache },
      "/careers/job.css": { headers: shortCache },
      "/careers/job.js": { headers: shortCache },
      "/careers/share.js": { headers: shortCache },
      "/mailto-fallback.js": { headers: shortCache },
      "/api/**": { headers: { "Cache-Control": "no-store" } },
    },
  } as { preset?: string },
});
