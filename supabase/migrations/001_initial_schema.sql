create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  kind text not null check (kind in ('income', 'expense')),
  color text not null default '#8fd3b6',
  created_at timestamptz not null default now()
);

create unique index if not exists categories_user_kind_name_key
  on public.categories (user_id, kind, lower(name));

create table if not exists public.recurrences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 160),
  amount_cents integer not null check (amount_cents > 0),
  kind text not null check (kind in ('income', 'expense')),
  category text not null check (char_length(trim(category)) between 1 and 80),
  day_of_month integer not null check (day_of_month between 1 and 31),
  start_month text not null check (start_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  end_month text check (end_month is null or end_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  notes text check (notes is null or char_length(notes) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_month is null or end_month >= start_month)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  description text not null check (char_length(trim(description)) between 1 and 160),
  amount_cents integer not null check (amount_cents > 0),
  kind text not null check (kind in ('income', 'expense')),
  category text not null check (char_length(trim(category)) between 1 and 80),
  status text not null default 'pending' check (status in ('pending', 'paid', 'received')),
  due_date date,
  reference_month text not null check (reference_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  notes text check (notes is null or char_length(notes) <= 1000),
  recurrence_id uuid references public.recurrences(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (kind = 'expense' and status in ('pending', 'paid')) or
    (kind = 'income' and status in ('pending', 'received'))
  )
);

create unique index if not exists entries_recurrence_month_key
  on public.entries (recurrence_id, reference_month)
  where recurrence_id is not null;

create index if not exists entries_user_month_idx on public.entries (user_id, reference_month);
create index if not exists recurrences_user_active_idx on public.recurrences (user_id, active);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_set_updated_at on public.entries;
create trigger entries_set_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

drop trigger if exists recurrences_set_updated_at on public.recurrences;
create trigger recurrences_set_updated_at
before update on public.recurrences
for each row execute function public.set_updated_at();

alter table public.entries enable row level security;
alter table public.categories enable row level security;
alter table public.recurrences enable row level security;

drop policy if exists "Users manage own entries" on public.entries;
create policy "Users manage own entries"
on public.entries for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own categories" on public.categories;
create policy "Users manage own categories"
on public.categories for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage own recurrences" on public.recurrences;
create policy "Users manage own recurrences"
on public.recurrences for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.entries from anon;
revoke all on public.categories from anon;
revoke all on public.recurrences from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.entries to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.recurrences to authenticated;
