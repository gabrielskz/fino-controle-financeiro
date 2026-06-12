alter table public.entries
  add column if not exists installment_group_id uuid,
  add column if not exists installment_number integer,
  add column if not exists installment_total integer;

alter table public.entries
  drop constraint if exists entries_installments_check;

alter table public.entries
  add constraint entries_installments_check check (
    (installment_group_id is null and installment_number is null and installment_total is null)
    or
    (
      installment_group_id is not null
      and installment_number between 1 and installment_total
      and installment_total between 2 and 120
    )
  );

create index if not exists entries_installment_group_idx
  on public.entries (user_id, installment_group_id)
  where installment_group_id is not null;

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Usuário não autenticado';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;

