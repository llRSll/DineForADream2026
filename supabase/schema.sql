-- Live Event App schema
-- Run in Supabase SQL editor (or via the migration in this repo).

create extension if not exists "pgcrypto";

-- Attendees -------------------------------------------------------------
create table if not exists public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  table_name text,
  company text,
  created_at timestamptz not null default now()
);

-- Polls -----------------------------------------------------------------
create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null default '[]'::jsonb,
  is_open boolean not null default false,
  created_at timestamptz not null default now()
);

-- Votes -----------------------------------------------------------------
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  option_index int not null,
  created_at timestamptz not null default now(),
  unique (poll_id, attendee_id)
);

-- Question groups (themes from AI clustering) ---------------------------
create table if not exists public.question_groups (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  summary text,
  proposed_question text,
  count int not null default 0,
  created_at timestamptz not null default now()
);

-- Questions -------------------------------------------------------------
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  attendee_id uuid references public.attendees(id) on delete set null,
  group_id uuid references public.question_groups(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Survey ----------------------------------------------------------------
create table if not exists public.survey_settings (
  id uuid primary key default gen_random_uuid(),
  is_open boolean not null default false,
  show_results boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.survey_questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  type text not null check (type in ('single', 'multi', 'text')),
  options jsonb not null default '[]'::jsonb,
  allow_custom boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answer_groups (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  label text not null,
  summary text,
  proposed_summary text,
  count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.survey_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.survey_questions(id) on delete cascade,
  attendee_id uuid not null references public.attendees(id) on delete cascade,
  option_indices jsonb,
  custom_text text,
  group_id uuid references public.survey_answer_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (question_id, attendee_id)
);

insert into public.survey_settings (is_open, show_results)
select false, false
where not exists (select 1 from public.survey_settings);

-- Schedule --------------------------------------------------------------
create table if not exists public.schedule_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  start_time text,
  end_time text,
  speaker text,
  description text,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Row Level Security ----------------------------------------------------
-- The server uses the service-role key (bypasses RLS) for all writes.
-- The browser uses the anon key for read-only realtime subscriptions, so
-- we allow public SELECT on the display tables only.
alter table public.attendees enable row level security;
alter table public.polls enable row level security;
alter table public.votes enable row level security;
alter table public.questions enable row level security;
alter table public.question_groups enable row level security;
alter table public.survey_settings enable row level security;
alter table public.survey_questions enable row level security;
alter table public.survey_answers enable row level security;
alter table public.survey_answer_groups enable row level security;
alter table public.schedule_items enable row level security;

drop policy if exists "read polls" on public.polls;
create policy "read polls" on public.polls for select using (true);

drop policy if exists "read votes" on public.votes;
create policy "read votes" on public.votes for select using (true);

drop policy if exists "read questions" on public.questions;
create policy "read questions" on public.questions for select using (true);

drop policy if exists "read question_groups" on public.question_groups;
create policy "read question_groups" on public.question_groups for select using (true);

drop policy if exists "read survey_settings" on public.survey_settings;
create policy "read survey_settings" on public.survey_settings for select using (true);

drop policy if exists "read survey_questions" on public.survey_questions;
create policy "read survey_questions" on public.survey_questions for select using (true);

drop policy if exists "read survey_answers" on public.survey_answers;
create policy "read survey_answers" on public.survey_answers for select using (true);

drop policy if exists "read survey_answer_groups" on public.survey_answer_groups;
create policy "read survey_answer_groups" on public.survey_answer_groups for select using (true);

drop policy if exists "read schedule_items" on public.schedule_items;
create policy "read schedule_items" on public.schedule_items for select using (true);

-- Note: attendees has RLS enabled with NO select policy, so attendee PII is
-- not publicly readable via the anon key.

-- Realtime --------------------------------------------------------------
alter publication supabase_realtime add table public.polls;
alter publication supabase_realtime add table public.votes;
alter publication supabase_realtime add table public.questions;
alter publication supabase_realtime add table public.question_groups;
alter publication supabase_realtime add table public.survey_settings;
alter publication supabase_realtime add table public.survey_questions;
alter publication supabase_realtime add table public.survey_answers;
alter publication supabase_realtime add table public.survey_answer_groups;
alter publication supabase_realtime add table public.schedule_items;
