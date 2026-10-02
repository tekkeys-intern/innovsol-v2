-- ─────────────────────────────────────────────────────────────────────────────
-- Innovsol Version 2 — feature migration 0002
-- Run AFTER 0001_init.sql (SQL editor → paste the file CONTENTS → Run).
-- Adds: candidate self-service account deletion, an optional MFA requirement for staff.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Candidate "delete my account & data" ─────────────────────────────────────
-- The portal first removes the user's resume files through the Storage API (deleting storage rows
-- with SQL would leave the files behind), then calls this function. Deleting the auth user cascades
-- to profiles → applications. Enquiries submitted by email address are not linked and are kept.
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not signed in'; end if;
  insert into public.audit_log(actor, action, entity, entity_id, detail)
    values (null, 'account.deleted', 'profiles', uid::text, jsonb_build_object('self_service', true));
  delete from auth.users where id = uid;
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- audit_log.actor references profiles(id); keep history when a profile is removed
alter table public.audit_log drop constraint if exists audit_log_actor_fkey;
alter table public.audit_log add constraint audit_log_actor_fkey
  foreign key (actor) references public.profiles(id) on delete set null;
alter table public.jobs drop constraint if exists jobs_created_by_fkey;
alter table public.jobs add constraint jobs_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

-- ── Optional: REQUIRE multi-factor authentication for staff ──────────────────
-- Staff can enrol a TOTP authenticator in the portal today. To make it mandatory, run this to
-- replace is_staff() so recruiter/admin powers only apply to sessions that passed MFA (aal2).
-- Enrol your own authenticator FIRST or you will lock yourself out of the staff views.
--
-- create or replace function public.is_staff() returns boolean
-- language sql stable security definer set search_path = public as $$
--   select coalesce(public.current_role_name() in ('recruiter', 'admin'), false)
--          and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
-- $$;

-- ── Jobs: staff can set who created a job automatically ──────────────────────
create or replace function public.set_job_creator() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.created_by is null then new.created_by := auth.uid(); end if;
  return new;
end $$;
drop trigger if exists jobs_creator on public.jobs;
create trigger jobs_creator before insert on public.jobs for each row execute function public.set_job_creator();
