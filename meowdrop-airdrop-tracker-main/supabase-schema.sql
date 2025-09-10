-- SQL to create or evolve the projects table in Supabase
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  -- legacy/basic fields
  details text,
  chain text,
  status text default 'On Progress',
  created_at timestamptz default now()
);

-- Add new tracker fields if not exist
do $$ begin
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='login_type') then
    alter table public.projects add column login_type text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='wallet_type') then
    alter table public.projects add column wallet_type text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='wallet_address') then
    alter table public.projects add column wallet_address text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='contact_email') then
    alter table public.projects add column contact_email text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='social_type') then
    alter table public.projects add column social_type text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='social_username') then
    alter table public.projects add column social_username text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='detail_task') then
    alter table public.projects add column detail_task text;
  end if;
  -- new structured tasks list (jsonb)
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='tasks') then
    alter table public.projects add column tasks jsonb default '[]'::jsonb;
  end if;
  -- per-day checkbox progress for tasks: {"YYYY-MM-DD": [bool,bool,...]}
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='task_progress') then
    alter table public.projects add column task_progress jsonb default '{}'::jsonb;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='links') then
    alter table public.projects add column links jsonb default '[]'::jsonb;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='faucet_link') then
    alter table public.projects add column faucet_link text;
  end if;
  if not exists(select 1 from information_schema.columns where table_schema='public' and table_name='projects' and column_name='result') then
    alter table public.projects add column result text;
  end if;
end $$;

-- Enable RLS and policies so users can only see their data
alter table public.projects enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='Projects are viewable by owner') then
    create policy "Projects are viewable by owner" on public.projects
      for select using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='Projects are insertable by owner') then
    create policy "Projects are insertable by owner" on public.projects
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='Projects are updatable by owner') then
    create policy "Projects are updatable by owner" on public.projects
      for update using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='Projects are deletable by owner') then
    create policy "Projects are deletable by owner" on public.projects
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- Master list tables for reusable types
create table if not exists public.wallet_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

create table if not exists public.social_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  unique(user_id, name)
);

alter table public.wallet_types enable row level security;
alter table public.social_types enable row level security;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='wallet_types' and policyname='Wallet types are viewable by owner') then
    create policy "Wallet types are viewable by owner" on public.wallet_types
      for select using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='wallet_types' and policyname='Wallet types are insertable by owner') then
    create policy "Wallet types are insertable by owner" on public.wallet_types
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='wallet_types' and policyname='Wallet types are updatable by owner') then
    create policy "Wallet types are updatable by owner" on public.wallet_types
      for update using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='wallet_types' and policyname='Wallet types are deletable by owner') then
    create policy "Wallet types are deletable by owner" on public.wallet_types
      for delete using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='social_types' and policyname='Social types are viewable by owner') then
    create policy "Social types are viewable by owner" on public.social_types
      for select using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='social_types' and policyname='Social types are insertable by owner') then
    create policy "Social types are insertable by owner" on public.social_types
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='social_types' and policyname='Social types are updatable by owner') then
    create policy "Social types are updatable by owner" on public.social_types
      for update using (auth.uid() = user_id);
  end if;
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='social_types' and policyname='Social types are deletable by owner') then
    create policy "Social types are deletable by owner" on public.social_types
      for delete using (auth.uid() = user_id);
  end if;
end $$;
