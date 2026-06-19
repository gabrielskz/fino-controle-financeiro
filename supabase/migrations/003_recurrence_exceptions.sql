create table if not exists public.recurrence_exceptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  recurrence_id uuid not null references public.recurrences(id) on delete cascade,
  reference_month text not null check (reference_month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  created_at timestamptz not null default now(),
  unique (user_id, recurrence_id, reference_month)
);

create index if not exists recurrence_exceptions_user_month_idx
  on public.recurrence_exceptions (user_id, reference_month);

alter table public.recurrence_exceptions enable row level security;

drop policy if exists "Users manage own recurrence exceptions"
  on public.recurrence_exceptions;

create policy "Users manage own recurrence exceptions"
on public.recurrence_exceptions for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on public.recurrence_exceptions from anon;
grant select, insert, update, delete on public.recurrence_exceptions to authenticated;
