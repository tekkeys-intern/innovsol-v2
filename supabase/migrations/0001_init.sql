-- ─────────────────────────────────────────────────────────────────────────────
-- Innovsol Version 2 — initial schema
-- Run in the Supabase SQL editor (or `supabase db push`). Idempotent where practical.
--
-- Roles (one per user, stored in public.profiles.role):
--   candidate  – default for anyone who signs up; sees only their own data
--   recruiter  – reads/updates all applications, manages jobs
--   admin      – everything a recruiter can + manages users/roles + audit log
--
-- Security model: every table has ROW LEVEL SECURITY enabled. The browser only ever
-- holds the public "anon" key, so RLS is the real gatekeeper. The service-role key
-- is never shipped to the client (server functions only).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── types ────────────────────────────────────────────────────────────────────
do $$ begin
  create type public.app_role as enum ('candidate', 'recruiter', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.application_status as enum ('submitted', 'in_review', 'interview', 'offer', 'rejected', 'withdrawn');
exception when duplicate_object then null; end $$;

-- ── profiles (1:1 with auth.users) ───────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        public.app_role not null default 'candidate',
  created_at  timestamptz not null default now()
);

-- helper used by policies. SECURITY DEFINER so it can read profiles without recursion.
create or replace function public.current_role_name() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() in ('recruiter', 'admin'), false)
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_role_name() = 'admin', false)
$$;

-- new auth user → profile row (always 'candidate'; promote via SQL / admin UI)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── jobs ─────────────────────────────────────────────────────────────────────
create table if not exists public.jobs (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  summary      text,
  location     text default 'Remote / Hybrid',
  employment   text default 'Full-Time',
  published    boolean not null default false,
  created_by   uuid references public.profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── applications ─────────────────────────────────────────────────────────────
create table if not exists public.applications (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references public.jobs(id) on delete cascade,
  applicant_id uuid not null references public.profiles(id) on delete cascade,
  cover_note   text check (char_length(cover_note) <= 4000),
  resume_path  text,                       -- object path in the private 'resumes' bucket
  status       public.application_status not null default 'submitted',
  internal_notes text,                     -- staff only (see column-level grant below)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (job_id, applicant_id)            -- one application per person per role
);
create index if not exists applications_applicant_idx on public.applications(applicant_id);
create index if not exists applications_job_idx on public.applications(job_id);

-- ── inbound enquiries (replaces "email only" for the contact form in V2) ─────
create table if not exists public.enquiries (
  id            uuid primary key default gen_random_uuid(),
  first_name    text not null check (char_length(first_name) <= 60),
  last_name     text not null check (char_length(last_name) <= 60),
  email         text not null check (email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$' and char_length(email) <= 254),
  phone         text check (char_length(phone) <= 30),
  company       text not null check (char_length(company) <= 120),
  industry      text,
  enquiry_type  text,
  message       text check (char_length(message) <= 4000),
  kind          text not null default 'contact' check (kind in ('contact', 'playbook')),
  handled       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── audit log (append-only) ──────────────────────────────────────────────────
create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor      uuid references public.profiles(id),
  action     text not null,
  entity     text not null,
  entity_id  text,
  detail     jsonb,
  created_at timestamptz not null default now()
);

-- updated_at maintenance
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists jobs_touch on public.jobs;
create trigger jobs_touch before update on public.jobs for each row execute function public.touch_updated_at();
drop trigger if exists applications_touch on public.applications;
create trigger applications_touch before update on public.applications for each row execute function public.touch_updated_at();

-- audit status changes automatically
create or replace function public.audit_application_change() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'UPDATE' and new.status is distinct from old.status) then
    insert into public.audit_log(actor, action, entity, entity_id, detail)
    values (auth.uid(), 'application.status', 'applications', new.id::text, jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;
drop trigger if exists applications_audit on public.applications;
create trigger applications_audit after update on public.applications for each row execute function public.audit_application_change();

-- ── ROW LEVEL SECURITY ───────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.jobs         enable row level security;
alter table public.applications enable row level security;
alter table public.enquiries    enable row level security;
alter table public.audit_log    enable row level security;

-- profiles: read own; staff read all; only admins change roles (never yourself via the API)
drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_staff on public.profiles;
drop policy if exists profiles_update_own   on public.profiles;
drop policy if exists profiles_admin_all    on public.profiles;
create policy profiles_select_own   on public.profiles for select using (id = auth.uid());
create policy profiles_select_staff on public.profiles for select using (public.is_staff());
create policy profiles_update_own   on public.profiles for update using (id = auth.uid())
  with check (id = auth.uid() and role = public.current_role_name());  -- cannot self-promote (function avoids RLS recursion)
create policy profiles_admin_all    on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- jobs: public can read published; staff manage
drop policy if exists jobs_public_read on public.jobs;
drop policy if exists jobs_staff_all   on public.jobs;
create policy jobs_public_read on public.jobs for select using (published or public.is_staff());
create policy jobs_staff_all   on public.jobs for all using (public.is_staff()) with check (public.is_staff());

-- applications: candidates see/create their own; staff see/update all
drop policy if exists apps_select_own   on public.applications;
drop policy if exists apps_insert_own   on public.applications;
drop policy if exists apps_withdraw_own on public.applications;
drop policy if exists apps_staff_all    on public.applications;
create policy apps_select_own   on public.applications for select using (applicant_id = auth.uid());
create policy apps_insert_own   on public.applications for insert with check (
  applicant_id = auth.uid() and status = 'submitted'
  and exists (select 1 from public.jobs j where j.id = job_id and j.published));
create policy apps_withdraw_own on public.applications for update
  using (applicant_id = auth.uid() and status in ('submitted', 'in_review'))
  with check (applicant_id = auth.uid() and status = 'withdrawn');
create policy apps_staff_all    on public.applications for all using (public.is_staff()) with check (public.is_staff());

-- Internal notes must never reach candidates, even on their own row. A column-level
-- REVOKE is ignored while a table-level grant exists, so revoke the table grant and
-- grant back only the safe columns. Clients must therefore select explicit columns
-- (never `select *`). Staff read the notes through the RPC below.
revoke select on public.applications from anon, authenticated;
grant  select (id, job_id, applicant_id, cover_note, resume_path, status, created_at, updated_at)
  on public.applications to authenticated;
-- Only `status` is directly updatable by API users. RLS decides WHO: candidates may only
-- move their own row to 'withdrawn'; staff may set any status.
revoke update on public.applications from anon, authenticated;
grant  update (status) on public.applications to authenticated;

create or replace function public.staff_internal_notes(app_id uuid) returns text
language sql stable security definer set search_path = public as $$
  select internal_notes from public.applications where id = app_id and public.is_staff()
$$;

create or replace function public.staff_set_internal_notes(app_id uuid, note text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'forbidden'; end if;
  update public.applications set internal_notes = left(note, 4000) where id = app_id;
end $$;
revoke all on function public.staff_internal_notes(uuid), public.staff_set_internal_notes(uuid, text) from public, anon;
grant execute on function public.staff_internal_notes(uuid), public.staff_set_internal_notes(uuid, text) to authenticated;

-- enquiries: anyone may INSERT (rate-limited at the API layer); only staff read
drop policy if exists enq_insert_any on public.enquiries;
drop policy if exists enq_staff_all  on public.enquiries;
create policy enq_insert_any on public.enquiries for insert to anon, authenticated with check (handled = false);
create policy enq_staff_all  on public.enquiries for all using (public.is_staff()) with check (public.is_staff());

-- audit: staff read, nobody updates/deletes via the API (inserts come from triggers / service role)
drop policy if exists audit_staff_read on public.audit_log;
create policy audit_staff_read on public.audit_log for select using (public.is_admin());

-- ── storage: private resume bucket ───────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880,
        array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

-- files live at  resumes/<user_id>/<filename>
drop policy if exists resumes_insert_own on storage.objects;
drop policy if exists resumes_read_own   on storage.objects;
drop policy if exists resumes_staff_read on storage.objects;
create policy resumes_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resumes_read_own   on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and (storage.foldername(name))[1] = auth.uid()::text);
create policy resumes_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and public.is_staff());

-- ── first admin ──────────────────────────────────────────────────────────────
-- After you sign up once in the portal, promote yourself in the SQL editor:
--   update public.profiles set role = 'admin' where email = 'you@innovsol.ai';
