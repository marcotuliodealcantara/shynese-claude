-- Study sessions: one row per flashcard session in which the user answered at least one card.
-- Powers the home stats (current/longest streak, sessions in the last 7 days).
-- Run once in the Supabase SQL Editor (or `supabase db push` if you adopt the Supabase CLI).

create table if not exists public.study_sessions (
  id              bigint generated always as identity primary key,
  user_id         uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category        text,                                   -- null = "All Categories"
  started_at      timestamptz not null default now(),
  last_answer_at  timestamptz not null default now(),
  cards_planned   integer not null check (cards_planned > 0),
  cards_answered  integer not null default 0 check (cards_answered >= 0),
  correct_count   integer not null default 0 check (correct_count >= 0),
  completed       boolean not null default false,
  constraint study_sessions_answered_le_planned check (cards_answered <= cards_planned),
  constraint study_sessions_correct_le_answered check (correct_count <= cards_answered)
);

comment on table public.study_sessions is
  'Flashcard study sessions (created on the first answer). Used for streaks and activity stats.';

-- Covers the FK (fast ON DELETE CASCADE) and the "my sessions, newest first" reads.
create index if not exists study_sessions_user_started_idx
  on public.study_sessions (user_id, started_at desc);

-- Row Level Security: each user only sees and changes their own sessions.
alter table public.study_sessions enable row level security;

create policy "Users can view own sessions"
  on public.study_sessions for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own sessions"
  on public.study_sessions for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own sessions"
  on public.study_sessions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own sessions"
  on public.study_sessions for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Signed-out (anon) clients never need this table.
revoke all on table public.study_sessions from anon;

-- Verification (optional):
-- select count(*) from public.study_sessions;   -- 0 right after the migration
-- select policyname, cmd from pg_policies where tablename = 'study_sessions';
