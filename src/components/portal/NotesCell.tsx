import { useState } from "react";
import { supabase } from "../../lib/supabase";

/** Staff-only internal notes for one application (read/written through SECURITY DEFINER RPCs). */
export function NotesCell({ applicationId }: { applicationId: string }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "saving" | "saved" | "error">("idle");

  async function toggle() {
    if (open) return setOpen(false);
    setOpen(true);
    setState("loading");
    const { data, error } = await supabase().rpc("staff_internal_notes", { app_id: applicationId });
    if (error) return setState("error");
    setText((data as string | null) ?? "");
    setState("idle");
  }

  async function save() {
    setState("saving");
    const { error } = await supabase().rpc("staff_set_internal_notes", {
      app_id: applicationId,
      note: text,
    });
    setState(error ? "error" : "saved");
  }

  return (
    <div>
      <button
        onClick={toggle}
        className="font-medium text-blue-700 hover:underline"
        aria-expanded={open}
      >
        Notes
      </button>
      {open && (
        <div className="mt-2 w-64 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setState("idle");
            }}
            rows={4}
            maxLength={4000}
            aria-label="Internal notes (visible to staff only)"
            placeholder="Internal notes: never shown to the candidate"
            className="w-full rounded-md border border-slate-300 p-2 text-sm"
            disabled={state === "loading"}
          />
          <div className="mt-1 flex items-center justify-between text-xs">
            <button
              onClick={save}
              disabled={state === "saving" || state === "loading"}
              className="rounded-md bg-slate-900 px-3 py-1 font-semibold text-white disabled:opacity-60"
            >
              Save
            </button>
            <span role="status" className={state === "error" ? "text-red-600" : "text-green-700"}>
              {state === "saved" ? "Saved" : state === "error" ? "Could not save" : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
