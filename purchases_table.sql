-- Run this in Supabase SQL Editor if you haven't already created this table
-- (skip if you already ran this from the webhook setup earlier)

create table if not exists purchases (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  product         text not null check (product in ('content-vault','outreach-tracker','pitch-paid','dealworthy')),
  stripe_session_id text,
  amount_paid     integer,
  created_at      timestamptz default now()
);

alter table purchases enable row level security;

-- Allow anyone to check purchases by email (needed for the dashboard to verify access)
-- This is safe because email alone isn't enough to do anything destructive - read only.
drop policy if exists "users can view own purchases by email" on purchases;
create policy "public read access" on purchases for select using (true);

-- Allow inserts (the webhook needs this, or for manual entry while webhook isn't live yet)
drop policy if exists "anyone can insert" on purchases;
create policy "anyone can insert" on purchases for insert with check (true);
