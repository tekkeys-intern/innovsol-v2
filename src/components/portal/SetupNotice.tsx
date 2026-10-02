export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 p-7">
      <h1 className="text-xl font-bold text-amber-900">Portal not configured yet</h1>
      <p className="mt-2 text-sm text-amber-900/80">
        Add these two variables (see <code>.env.example</code> and{" "}
        <code>docs/ARCHITECTURE-V2.md</code>), then restart:
      </p>
      <pre className="mt-3 overflow-x-auto rounded-md bg-white p-3 text-xs">{`VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key`}</pre>
      <p className="mt-3 text-sm text-amber-900/80">
        Then run <code>supabase/migrations/0001_init.sql</code> in the Supabase SQL editor.
      </p>
    </div>
  );
}
