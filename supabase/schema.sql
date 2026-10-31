-- AgriRenta database for Supabase (PostgreSQL)
-- Run this ONCE in: Supabase Dashboard > SQL Editor > New query > paste > Run

create table if not exists public.app_state (
  state_key  text primary key,
  state      jsonb not null,
  rev        bigint not null default 1,
  updated_at timestamptz not null default now()
);

-- Lock the table: nobody can read/write it directly from the browser.
-- Only the "api" Edge Function (which uses the service role key) can touch it.
alter table public.app_state enable row level security;
revoke all on public.app_state from anon, authenticated;
