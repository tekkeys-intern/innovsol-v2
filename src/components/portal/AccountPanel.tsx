import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase, type Profile } from "../../lib/supabase";

const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";
const input =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";

interface Factor {
  id: string;
  status: string;
  friendly_name?: string | null;
}

/** Multi-factor authentication (authenticator app / TOTP). Recommended for staff. */
function MfaSection({ staff }: { staff: boolean }) {
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrol, setEnrol] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase().auth.mfa.listFactors();
    setFactors(((data?.totp as Factor[] | undefined) ?? []).filter((f) => f.status === "verified"));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function start() {
    setMsg(null);
    // clear any half-finished enrolment first
    const all = await supabase().auth.mfa.listFactors();
    for (const f of (all.data?.all ?? []) as Factor[])
      if (f.status !== "verified") await supabase().auth.mfa.unenroll({ factorId: f.id });
    const { data, error } = await supabase().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
    });
    if (error || !data)
      return setMsg({ kind: "err", text: error?.message ?? "Could not start enrolment." });
    setEnrol({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enrol) return;
    const code = String(new FormData(e.currentTarget).get("code") ?? "").trim();
    const sb = supabase();
    const ch = await sb.auth.mfa.challenge({ factorId: enrol.id });
    if (ch.error) return setMsg({ kind: "err", text: ch.error.message });
    const v = await sb.auth.mfa.verify({ factorId: enrol.id, challengeId: ch.data.id, code });
    if (v.error)
      return setMsg({ kind: "err", text: "That code was not accepted. Try the current code." });
    setEnrol(null);
    setMsg({ kind: "ok", text: "Two-factor authentication is on." });
    void load();
  }

  async function remove(id: string) {
    if (!window.confirm("Turn off two-factor authentication?")) return;
    const { error } = await supabase().auth.mfa.unenroll({ factorId: id });
    if (error) setMsg({ kind: "err", text: error.message });
    else void load();
  }

  return (
    <div>
      <h3 className="font-semibold">Two-factor authentication</h3>
      <p className="mt-1 text-sm text-slate-500">
        {factors.length
          ? "Enabled: you will be asked for a code from your authenticator app when you sign in."
          : staff
            ? "Strongly recommended for staff accounts."
            : "Add an extra layer of security with an authenticator app."}
      </p>
      {factors.map((f) => (
        <p key={f.id} className="mt-2 text-sm">
          ✓ {f.friendly_name || "Authenticator"}{" "}
          <button onClick={() => remove(f.id)} className="ml-2 text-red-600 hover:underline">
            Remove
          </button>
        </p>
      ))}
      {!factors.length && !enrol && (
        <button
          onClick={start}
          className="mt-3 rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
        >
          Set up authenticator app
        </button>
      )}
      {enrol && (
        <form onSubmit={verify} className="mt-3 space-y-3">
          <p className="text-sm">
            Scan this QR code with Google Authenticator, 1Password, Authy or similar, then enter the
            6-digit code.
          </p>
          <img
            src={enrol.qr}
            alt="QR code for your authenticator app"
            width={160}
            height={160}
            className="rounded-md border border-slate-200"
          />
          <p className="text-xs text-slate-500">
            Can't scan? Enter this key manually: <code className="break-all">{enrol.secret}</code>
          </p>
          <label className="block text-sm font-medium">
            6-digit code
            <input
              name="code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              autoComplete="one-time-code"
              className={input}
            />
          </label>
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            Verify and turn on
          </button>
        </form>
      )}
      <p
        role="status"
        aria-live="polite"
        className={`mt-2 min-h-5 text-sm ${msg?.kind === "err" ? "text-red-600" : "text-green-700"}`}
      >
        {msg?.text}
      </p>
    </div>
  );
}

/** Self-service data deletion (GDPR / DPDP "right to erasure"). */
function DeleteSection({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function remove() {
    setBusy(true);
    setErr("");
    const sb = supabase();
    // 1. remove resume files through the Storage API (SQL deletes would orphan the files)
    const list = await sb.storage.from("resumes").list(profile.id, { limit: 1000 });
    const paths = (list.data ?? []).map((o) => `${profile.id}/${o.name}`);
    if (paths.length) {
      const del = await sb.storage.from("resumes").remove(paths);
      if (del.error) {
        setBusy(false);
        return setErr(del.error.message);
      }
    }
    // 2. delete the account (cascades to profile + applications)
    const { error } = await sb.rpc("delete_my_account");
    if (error) {
      setBusy(false);
      return setErr(error.message);
    }
    await sb.auth.signOut();
    void navigate({ to: "/" });
  }

  return (
    <div>
      <h3 className="font-semibold text-red-700">Delete my account &amp; data</h3>
      <p className="mt-1 text-sm text-slate-500">
        Permanently removes your account, applications and uploaded resumes. This cannot be undone.
      </p>
      <label className="mt-3 block text-sm font-medium">
        Type <b>DELETE</b> to confirm
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className={input}
          autoComplete="off"
        />
      </label>
      <button
        onClick={remove}
        disabled={confirmText !== "DELETE" || busy}
        className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
      >
        {busy ? "Deleting…" : "Delete everything"}
      </button>
      {err && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {err}
        </p>
      )}
    </div>
  );
}

export function AccountPanel({ profile, staff }: { profile: Profile; staff: boolean }) {
  return (
    <section className={`${card} grid gap-8 md:grid-cols-2`} aria-labelledby="acct-h">
      <h2 id="acct-h" className="sr-only">
        Account security and privacy
      </h2>
      <MfaSection staff={staff} />
      <DeleteSection profile={profile} />
    </section>
  );
}
