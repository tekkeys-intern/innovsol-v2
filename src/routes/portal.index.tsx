import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  isStaff,
  portalEnabled,
  supabase,
  useAuth,
  type Profile,
  type Role,
} from "../lib/supabase";
import { SetupNotice } from "../components/portal/SetupNotice";
import { JobsManager } from "../components/portal/JobsManager";
import { NotesCell } from "../components/portal/NotesCell";
import { AccountPanel } from "../components/portal/AccountPanel";

export const Route = createFileRoute("/portal/")({ component: Dashboard });

const STATUSES = ["submitted", "in_review", "interview", "offer", "rejected", "withdrawn"] as const;
const badge: Record<string, string> = {
  submitted: "bg-slate-100 text-slate-700",
  in_review: "bg-blue-100 text-blue-800",
  interview: "bg-violet-100 text-violet-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-amber-100 text-amber-800",
};
const label = (s: string) => s.replace("_", " ");
const card = "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm";

function Dashboard() {
  const { loading, session, profile } = useAuth();
  const navigate = useNavigate();

  // "?job=<slug>" comes from the Apply buttons on the website: remember it through sign-in
  useEffect(() => {
    const job = new URLSearchParams(window.location.search).get("job");
    if (job) sessionStorage.setItem("applyJob", job);
  }, []);

  useEffect(() => {
    if (portalEnabled && !loading && !session) void navigate({ to: "/portal/login" });
  }, [loading, session, navigate]);

  if (!portalEnabled) return <SetupNotice />;
  if (loading || !session) return <p className="text-slate-500">Loading…</p>;
  if (!profile)
    return <p className="text-slate-500">Setting up your profile… refresh in a moment.</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-sm text-slate-500">
          You are signed in as <b className="capitalize">{profile.role}</b>.
        </p>
      </div>
      {isStaff(profile.role) ? (
        <>
          <StaffApplications />
          <JobsManager />
        </>
      ) : (
        <CandidateArea profile={profile} />
      )}
      {profile.role === "admin" && <AdminUsers me={profile} />}
      <AccountPanel profile={profile} staff={isStaff(profile.role)} />
    </div>
  );
}

/* ───────────────────────────── candidate ───────────────────────────── */
interface Job {
  id: string;
  slug: string;
  title: string;
}
interface MyApp {
  id: string;
  status: string;
  created_at: string;
  jobs: { title: string } | null;
}

function CandidateArea({ profile }: { profile: Profile }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<MyApp[]>([]);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);

  const load = useCallback(async () => {
    const sb = supabase();
    const [j, a] = await Promise.all([
      sb.from("jobs").select("id,slug,title").eq("published", true).order("title"),
      sb
        .from("applications")
        .select("id,status,created_at,jobs(title)")
        .eq("applicant_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);
    const list = (j.data as Job[]) ?? [];
    setJobs(list);
    const wanted = sessionStorage.getItem("applyJob");
    const match = wanted ? list.find((x) => x.slug === wanted) : undefined;
    if (match) setSelected((cur) => cur || match.id);
    setApps((a.data as unknown as MyApp[]) ?? []);
  }, [profile.id]);
  useEffect(() => {
    void load();
  }, [load]);

  async function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const jobId = String(f.get("job") ?? "");
    const note = String(f.get("note") ?? "").slice(0, 4000);
    const file = f.get("resume") as File | null;
    if (!jobId) return setMsg({ kind: "err", text: "Choose a role." });
    if (!file || !file.size)
      return setMsg({ kind: "err", text: "Please attach your resume (PDF or DOCX)." });
    if (file.size > 5 * 1024 * 1024)
      return setMsg({ kind: "err", text: "Resume must be 5 MB or smaller." });
    if (!/\.(pdf|docx?)$/i.test(file.name))
      return setMsg({ kind: "err", text: "Resume must be a PDF or Word document." });

    setBusy(true);
    setMsg(null);
    const sb = supabase();
    const path = `${profile.id}/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
    const up = await sb.storage
      .from("resumes")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (up.error) {
      setBusy(false);
      return setMsg({ kind: "err", text: up.error.message });
    }
    const ins = await sb.from("applications").insert({
      job_id: jobId,
      applicant_id: profile.id,
      cover_note: note || null,
      resume_path: path,
    });
    setBusy(false);
    if (ins.error)
      return setMsg({
        kind: "err",
        text:
          ins.error.code === "23505"
            ? "You have already applied for this role."
            : ins.error.message,
      });
    form.reset();
    setSelected("");
    sessionStorage.removeItem("applyJob");
    setMsg({ kind: "ok", text: "Application submitted. We will be in touch." });
    void load();
  }

  async function withdraw(id: string) {
    if (!window.confirm("Withdraw this application?")) return;
    await supabase().from("applications").update({ status: "withdrawn" }).eq("id", id);
    void load();
  }

  const input =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className={card} aria-labelledby="apply-h">
        <h2 id="apply-h" className="text-lg font-semibold">
          Apply for a role
        </h2>
        <form onSubmit={apply} className="mt-4 space-y-4">
          <label className="block text-sm font-medium">
            Role
            <select
              name="job"
              className={input}
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              <option value="" disabled>
                Select…
              </option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Cover note (optional)
            <textarea
              name="note"
              rows={4}
              maxLength={4000}
              className={input}
              placeholder="Why are you a good fit?"
            />
          </label>
          <label className="block text-sm font-medium">
            Resume — PDF or DOCX, max 5 MB <span className="text-red-600">*</span>
            <input name="resume" type="file" accept=".pdf,.doc,.docx" className={input} />
          </label>
          <button
            disabled={busy || !jobs.length}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {busy ? "Uploading…" : "Submit application"}
          </button>
          {!jobs.length && <p className="text-sm text-slate-500">No roles are published yet.</p>}
          <p
            role="status"
            aria-live="polite"
            className={`min-h-5 text-sm ${msg?.kind === "err" ? "text-red-600" : "text-green-700"}`}
          >
            {msg?.text}
          </p>
        </form>
      </section>
      <section className={card} aria-labelledby="mine-h">
        <h2 id="mine-h" className="text-lg font-semibold">
          My applications
        </h2>
        {apps.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nothing yet. Prefer email?{" "}
            <Link to="/careers" className="text-blue-700 underline">
              See open roles
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {apps.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{a.jobs?.title ?? "Role"}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${badge[a.status]}`}
                  >
                    {label(a.status)}
                  </span>
                  {(a.status === "submitted" || a.status === "in_review") && (
                    <button
                      onClick={() => withdraw(a.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ───────────────────────────── staff ───────────────────────────── */
interface StaffApp {
  id: string;
  status: string;
  created_at: string;
  cover_note: string | null;
  resume_path: string | null;
  jobs: { title: string } | null;
  profiles: { email: string; full_name: string | null } | null;
}

function StaffApplications() {
  const [rows, setRows] = useState<StaffApp[]>([]);
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await supabase()
      .from("applications")
      .select(
        "id,status,created_at,cover_note,resume_path,jobs(title),profiles:applicant_id(email,full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setErr(error.message);
    else setRows((data as unknown as StaffApp[]) ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(id: string, status: string) {
    const { error } = await supabase().from("applications").update({ status }).eq("id", id);
    if (error) setErr(error.message);
    else void load();
  }
  async function openResume(path: string) {
    const { data, error } = await supabase().storage.from("resumes").createSignedUrl(path, 60);
    if (error || !data) return setErr(error?.message ?? "Could not open resume");
    window.open(data.signedUrl, "_blank", "noopener");
  }

  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  return (
    <section className={card} aria-labelledby="apps-h">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="apps-h" className="text-lg font-semibold">
          Applications <span className="text-slate-400">({shown.length})</span>
        </h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Filter by status"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
        >
          <option value="all">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      </div>
      {err && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {err}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">Candidate</th>
              <th className="pr-3">Role</th>
              <th className="pr-3">Applied</th>
              <th className="pr-3">Resume</th>
              <th>Status</th>
              <th className="pl-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {shown.map((r) => (
              <tr key={r.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium">{r.profiles?.full_name || "—"}</p>
                  <p className="text-xs text-slate-500">{r.profiles?.email}</p>
                </td>
                <td className="pr-3">{r.jobs?.title}</td>
                <td className="pr-3 text-slate-500">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="pr-3">
                  {r.resume_path ? (
                    <button
                      onClick={() => openResume(r.resume_path!)}
                      className="font-medium text-blue-700 hover:underline"
                    >
                      Open
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <select
                    value={r.status}
                    onChange={(e) => setStatus(r.id, e.target.value)}
                    aria-label={`Status for ${r.profiles?.email}`}
                    className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold capitalize ${badge[r.status]}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {label(s)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="pl-3 align-top pt-3">
                  <NotesCell applicationId={r.id} />
                </td>
              </tr>
            ))}
            {!shown.length && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-slate-500">
                  No applications.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────────────────────── admin ───────────────────────────── */
function AdminUsers({ me }: { me: Profile }) {
  const [users, setUsers] = useState<Profile[]>([]);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const { data, error } = await supabase()
      .from("profiles")
      .select("id,email,full_name,role")
      .order("email")
      .limit(200);
    if (error) setErr(error.message);
    else setUsers((data as Profile[]) ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function setRole(id: string, role: Role) {
    if (id === me.id && role !== "admin" && !window.confirm("Remove your own admin access?"))
      return;
    const { error } = await supabase().from("profiles").update({ role }).eq("id", id);
    if (error) setErr(error.message);
    else void load();
  }
  return (
    <section className={card} aria-labelledby="users-h">
      <h2 id="users-h" className="text-lg font-semibold">
        Users &amp; roles <span className="text-slate-400">({users.length})</span>
      </h2>
      {err && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {err}
        </p>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="py-2 pr-3">User</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="py-3 pr-3">
                  <p className="font-medium">{u.full_name || "—"}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </td>
                <td>
                  <select
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as Role)}
                    aria-label={`Role for ${u.email}`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm capitalize"
                  >
                    {(["candidate", "recruiter", "admin"] as Role[]).map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
