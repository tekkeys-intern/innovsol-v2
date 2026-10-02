import { createClient, type SupabaseClient, type Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

// Public config only. The anon key is safe in the browser BECAUSE every table is protected by
// row-level security (see supabase/migrations/0001_init.sql). Never put the service-role key here.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** False until VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are set – the portal then shows setup help. */
export const portalEnabled = Boolean(url && anon);

let client: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (!portalEnabled) throw new Error("Supabase is not configured");
  client ??= createClient(url!, anon!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
  return client;
}

export type Role = "candidate" | "recruiter" | "admin";
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
}

export const isStaff = (r?: Role) => r === "recruiter" || r === "admin";

/** Current session + profile (role). `loading` is true until the first answer arrives. */
export function useAuth() {
  const [state, setState] = useState<{
    loading: boolean;
    session: Session | null;
    profile: Profile | null;
  }>({ loading: true, session: null, profile: null });

  useEffect(() => {
    if (!portalEnabled) {
      setState({ loading: false, session: null, profile: null });
      return;
    }
    const sb = supabase();
    let alive = true;

    async function load(session: Session | null) {
      if (!session) {
        if (alive) setState({ loading: false, session: null, profile: null });
        return;
      }
      const { data } = await sb
        .from("profiles")
        .select("id,email,full_name,role")
        .eq("id", session.user.id)
        .maybeSingle();
      if (alive) setState({ loading: false, session, profile: (data as Profile) ?? null });
    }

    sb.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
      void load(session);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
