-- Run this in Supabase SQL Editor

-- Blog posts table
create table blog_posts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  excerpt       text,
  content       text not null,
  cover_image   text,
  category      text,
  status        text not null default 'draft' check (status in ('draft','published')),
  author        text default 'Prin',
  published_at  timestamptz,
  created_at    timestamptz default now()
);

alter table blog_posts enable row level security;
create policy "anyone can read published posts" on blog_posts
  for select using (status = 'published');
create policy "anyone can insert drafts" on blog_posts
  for insert with check (true);
create policy "anyone can update posts" on blog_posts
  for update using (true);

-- Newsletter send log (tracks what's been sent, prevents duplicate sends)
create table newsletter_log (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('welcome','weekly')),
  subject       text,
  sent_count    integer default 0,
  sent_at       timestamptz default now()
);

alter table newsletter_log enable row level security;
create policy "anyone can read log" on newsletter_log for select using (true);
create policy "anyone can insert log" on newsletter_log for insert with check (true);
