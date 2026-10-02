import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../lib/supabase";

interface JobRow {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  location: string | null;
  employment: string | null;
  published: boolean;
}

const input =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200";
const slugify = (s: string) =>
  s
    .trim()
    .replace(/[^A-Za-z0-9]+(.)?/g, (_m, c: string | undefined) => (c ? c.toUpperCase() : ""))
    .slice(0, 60);

/** Staff: create, edit, publish and unpublish roles. (Deleting is intentionally not offered: it would cascade to applications.) */
export function JobsManager() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [editing, setEditing] = useState<JobRow | null>(null);
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await supabase()
      .from("jobs")
      .select("id,slug,title,summary,location,employment,published")
      .order("title");
    if (error) setMsg({ kind: "err", text: error.message });
    else setJobs((data as JobRow[]) ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const title = String(f.get("title") ?? "").trim();
    const slug = editing ? editing.slug : String(f.get("slug") || slugify(title)).trim();
    if (!title || !slug) return setMsg({ kind: "err", text: "Title is required." });
    const row = {
      title,
      summary: String(f.get("summary") ?? "").trim() || null,
      location: String(f.get("location") ?? "").trim() || null,
      employment: String(f.get("employment") ?? "").trim() || null,
      published: f.get("published") === "on",
    };
    setBusy(true);
    setMsg(null);
    const sb = supabase();
    const res = editing
      ? await sb.from("jobs").update(row).eq("id", editing.id)
      : await sb.from("jobs").insert({ slug, ...row });
    setBusy(false);
    if (res.error)
      return setMsg({
        kind: "err",
        text:
          res.error.code === "23505" ? "A role with that slug already exists." : res.error.message,
      });
    setMsg({ kind: "ok", text: editing ? "Role updated." : "Role created." });
    setEditing(null);
    (e.target as HTMLFormElement).reset();
    void load();
  }

  async function toggle(j: JobRow) {
    const { error } = await supabase()
      .from("jobs")
      .update({ published: !j.published })
      .eq("id", j.id);
    if (error) setMsg({ kind: "err", text: error.message });
    else void load();
  }

  return (
    <section
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="jobs-h"
    >
      <h2 id="jobs-h" className="text-lg font-semibold">
        Roles <span className="text-slate-400">({jobs.length})</span>
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Published roles appear in the candidate portal. The public job pages are generated from{" "}
        <code>content/jobs.json</code>.
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ul className="divide-y divide-slate-100">
          {jobs.map((j) => (
            <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className="font-medium">{j.title}</p>
                <p className="text-xs text-slate-500">
                  {j.slug} · {j.location ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${j.published ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"}`}
                >
                  {j.published ? "Published" : "Draft"}
                </span>
                <button
                  onClick={() => setEditing(j)}
                  className="font-medium text-blue-700 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => toggle(j)}
                  className="font-medium text-slate-700 hover:underline"
                >
                  {j.published ? "Unpublish" : "Publish"}
                </button>
              </div>
            </li>
          ))}
          {!jobs.length && <li className="py-4 text-sm text-slate-500">No roles yet.</li>}
        </ul>

        <form
          key={editing?.id ?? "new"}
          onSubmit={save}
          className="space-y-3 rounded-xl bg-slate-50 p-4"
          aria-label={editing ? "Edit role" : "New role"}
        >
          <h3 className="font-semibold">{editing ? `Edit: ${editing.title}` : "New role"}</h3>
          <label className="block text-sm font-medium">
            Title
            <input
              name="title"
              required
              maxLength={120}
              defaultValue={editing?.title}
              className={input}
            />
          </label>
          {!editing && (
            <label className="block text-sm font-medium">
              Slug (optional, generated from the title)
              <input name="slug" maxLength={60} className={input} />
            </label>
          )}
          <label className="block text-sm font-medium">
            Summary
            <textarea
              name="summary"
              rows={3}
              maxLength={2000}
              defaultValue={editing?.summary ?? ""}
              className={input}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Location
              <input
                name="location"
                maxLength={80}
                defaultValue={editing?.location ?? "Remote / Hybrid"}
                className={input}
              />
            </label>
            <label className="block text-sm font-medium">
              Employment
              <input
                name="employment"
                maxLength={40}
                defaultValue={editing?.employment ?? "Full-Time"}
                className={input}
              />
            </label>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="published" defaultChecked={editing?.published ?? false} />{" "}
            Published
          </label>
          <div className="flex gap-2">
            <button
              disabled={busy}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {busy ? "Saving…" : editing ? "Save changes" : "Create role"}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-white"
              >
                Cancel
              </button>
            )}
          </div>
          <p
            role="status"
            aria-live="polite"
            className={`min-h-5 text-sm ${msg?.kind === "err" ? "text-red-600" : "text-green-700"}`}
          >
            {msg?.text}
          </p>
        </form>
      </div>
    </section>
  );
}
