import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { portalEnabled, supabase, useAuth } from "../lib/supabase";

export const Route = createFileRoute("/portal")({
  head: () => ({
    meta: [
      { title: "Portal | Innovsol" },
      // The portal is private: keep it out of search results.
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PortalLayout,
});

function PortalLayout() {
  const { profile, session } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase().auth.signOut();
    void navigate({ to: "/portal/login" });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
          <div className="flex items-center gap-4">
            <a href="/" aria-label="Innovsol home">
              <img
                src="/images/logo.png"
                alt="Innovsol"
                className="h-9 w-auto"
                width={87}
                height={36}
              />
            </a>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Portal
            </span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            {/* plain link (full page load) so the home page starts cleanly */}
            <a
              href="/"
              className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-blue-700"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 10.5 12 3l9 7.5" />
                <path d="M5 9.5V21h5v-6h4v6h5V9.5" />
              </svg>
              Home
            </a>
            <Link to="/portal" className="font-medium text-slate-700 hover:text-blue-700">
              Dashboard
            </Link>
            {portalEnabled && session ? (
              <>
                <span className="hidden text-slate-500 sm:inline">
                  {profile?.email} · <b className="capitalize">{profile?.role ?? "…"}</b>
                </span>
                <button
                  onClick={signOut}
                  className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100"
                >
                  Sign out
                </button>
              </>
            ) : null}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">
        <Outlet />
      </main>
    </div>
  );
}
