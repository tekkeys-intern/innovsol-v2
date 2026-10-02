import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { portalEnabled, supabase, useAuth } from "../lib/supabase";
import { SetupNotice } from "../components/portal/SetupNotice";

export const Route = createFileRoute("/portal/reset")({ component: ResetPassword });

const input =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

/** Landing page of the "reset password" email. Supabase signs the user in from the link, then they choose a new password. */
function ResetPassword() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  if (!portalEnabled) return <SetupNotice />;
  if (loading) return <p className="text-slate-500">Checking your link…</p>;
  if (!session)
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-xl font-bold">This link has expired</h1>
        <p className="mt-2 text-sm text-slate-500">
          Request a new password reset from the sign-in page.
        </p>
        <a
          href="/portal/login"
          className="mt-4 inline-block text-sm font-medium text-blue-700 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const p1 = String(f.get("password") ?? "");
    if (p1.length < 8) return setMsg({ kind: "err", text: "Use at least 8 characters." });
    if (p1 !== String(f.get("confirm") ?? ""))
      return setMsg({ kind: "err", text: "The two passwords do not match." });
    setBusy(true);
    const { error } = await supabase().auth.updateUser({ password: p1 });
    setBusy(false);
    if (error) return setMsg({ kind: "err", text: error.message });
    setMsg({ kind: "ok", text: "Password updated." });
    setTimeout(() => void navigate({ to: "/portal" }), 800);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <label className="block text-sm font-medium">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={input}
          />
        </label>
        <label className="block text-sm font-medium">
          Confirm new password
          <input
            name="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={input}
          />
        </label>
        <button
          disabled={busy}
          className="w-full rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? "Saving…" : "Update password"}
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
