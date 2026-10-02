import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { portalEnabled, supabase, useAuth } from "../lib/supabase";
import { SetupNotice } from "../components/portal/SetupNotice";

export const Route = createFileRoute("/portal/login")({ component: Login });

const input =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
const primary =
  "w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60";

type Msg = { kind: "err" | "ok"; text: string } | null;

/** Turn Supabase auth errors into messages a candidate can act on. */
function friendly(error: { message: string; code?: string; status?: number }): string {
  const text = `${error.code ?? ""} ${error.message}`.toLowerCase();
  if (
    text.includes("rate limit") ||
    text.includes("over_email_send_rate_limit") ||
    error.status === 429
  )
    return "Too many sign-up emails have been sent in the last hour. Please wait about an hour and try again, or check your inbox: a confirmation email may already have been sent to you.";
  if (text.includes("already registered") || text.includes("user_already_exists"))
    return 'An account with this email already exists. Try signing in, or use "Forgot your password?".';
  if (text.includes("email not confirmed"))
    return "Please confirm your email first: open the link we sent you, then sign in.";
  if (text.includes("weak_password") || text.includes("password should"))
    return "Please choose a stronger password (at least 8 characters).";
  return error.message;
}

function Login() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);
  const [needMfa, setNeedMfa] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const applyJob = typeof window !== "undefined" ? sessionStorage.getItem("applyJob") : null;

  // Once signed in: go to the portal, unless a second factor is still required.
  useEffect(() => {
    if (!portalEnabled || loading || !session) return;
    void supabase()
      .auth.mfa.getAuthenticatorAssuranceLevel()
      .then(({ data }) => {
        if (data && data.nextLevel === "aal2" && data.currentLevel !== "aal2") setNeedMfa(true);
        else void navigate({ to: "/portal" });
      });
  }, [loading, session, navigate]);

  if (!portalEnabled) return <SetupNotice />;
  if (needMfa) return <MfaChallenge onDone={() => void navigate({ to: "/portal" })} />;

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const password = String(f.get("password") ?? "");
    const fullName = String(f.get("name") ?? "").trim();
    setBusy(true);
    setMsg(null);
    const sb = supabase();
    const { error } =
      mode === "in"
        ? await sb.auth.signInWithPassword({ email, password })
        : await sb.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
              emailRedirectTo: `${window.location.origin}/portal`,
            },
          });
    setBusy(false);
    if (error) return setMsg({ kind: "err", text: friendly(error) });
    if (mode === "up")
      setMsg({ kind: "ok", text: "Account created. Check your email to confirm, then sign in." });
    // signing in is handled by the effect above (it checks for a second factor)
  }

  async function emailLink(kind: "magic" | "reset") {
    const email = (document.getElementById("email") as HTMLInputElement | null)?.value.trim();
    if (!email) return setMsg({ kind: "err", text: "Enter your email first." });
    setBusy(true);
    const sb = supabase();
    const { error } =
      kind === "magic"
        ? await sb.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${window.location.origin}/portal` },
          })
        : await sb.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/portal/reset`,
          });
    setBusy(false);
    // Same message either way: do not reveal whether an account exists.
    setMsg(
      error && error.status !== 400
        ? { kind: "err", text: friendly(error) }
        : {
            kind: "ok",
            text:
              kind === "magic"
                ? "If that email can sign in, a link is on its way."
                : "If an account exists for that email, a password reset link is on its way.",
          },
    );
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-bold">{mode === "in" ? "Sign in" : "Create your account"}</h1>
      <p className="mt-1 text-sm text-slate-500">
        {applyJob
          ? "Sign in to continue your application. You will upload your resume next."
          : "Candidates track applications. Innovsol staff review them."}
      </p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        {mode === "up" && (
          <label className="block text-sm font-medium">
            Full name
            <input name="name" required maxLength={80} autoComplete="name" className={input} />
          </label>
        )}
        <label className="block text-sm font-medium">
          Email
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            className={input}
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "in" ? "current-password" : "new-password"}
            className={input}
          />
        </label>
        <button disabled={busy} className={primary}>
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        {mode === "in" && (
          <>
            <button
              type="button"
              onClick={() => emailLink("magic")}
              disabled={busy}
              className="w-full rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium hover:bg-slate-50"
            >
              Email me a sign-in link
            </button>
            <button
              type="button"
              onClick={() => emailLink("reset")}
              disabled={busy}
              className="text-sm font-medium text-blue-700 hover:underline"
            >
              Forgot your password?
            </button>
          </>
        )}
        <p
          role="status"
          aria-live="polite"
          className={`min-h-5 text-sm ${msg?.kind === "err" ? "text-red-600" : "text-green-700"}`}
        >
          {msg?.text}
        </p>
      </form>
      <button
        onClick={() => {
          setMode(mode === "in" ? "up" : "in");
          setMsg(null);
        }}
        className="text-sm font-medium text-blue-700 hover:underline"
      >
        {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

/** Second step for accounts with an authenticator app. */
function MfaChallenge({ onDone }: { onDone: () => void }) {
  const [msg, setMsg] = useState<Msg>(null);
  const [busy, setBusy] = useState(false);

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    setBusy(true);
    const sb = supabase();
    const { data: factors } = await sb.auth.mfa.listFactors();
    const factor = factors?.totp?.find((f) => f.status === "verified");
    if (!factor) {
      setBusy(false);
      return setMsg({ kind: "err", text: "No authenticator found for this account." });
    }
    const ch = await sb.auth.mfa.challenge({ factorId: factor.id });
    if (ch.error) {
      setBusy(false);
      return setMsg({ kind: "err", text: ch.error.message });
    }
    const v = await sb.auth.mfa.verify({ factorId: factor.id, challengeId: ch.data.id, code });
    setBusy(false);
    if (v.error)
      return setMsg({ kind: "err", text: "That code was not accepted. Try the current code." });
    onDone();
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-bold">Two-factor authentication</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter the 6-digit code from your authenticator app.
      </p>
      <form onSubmit={verify} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Code
          <input
            name="code"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            autoComplete="one-time-code"
            autoFocus
            className={input}
          />
        </label>
        <button disabled={busy} className={primary}>
          {busy ? "Checking…" : "Verify"}
        </button>
        <p
          role="status"
          aria-live="polite"
          className={`min-h-5 text-sm ${msg?.kind === "err" ? "text-red-600" : "text-green-700"}`}
        >
          {msg?.text}
        </p>
      </form>
    </div>
  );
}
