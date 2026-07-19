begin;

alter table public.transactions
add column if not exists recurrence_frequency text;

alter table public.transactions
add column if not exists recurrence_start_date date;

alter table public.transactions
add column if not exists recurrence_end_date date;

-- Existing recurring transactions were previously
-- treated as monthly transactions.
update public.transactions
set
  recurrence_frequency = coalesce(
    recurrence_frequency,
    'monthly'
  ),
  recurrence_start_date = coalesce(
    recurrence_start_date,
    transaction_date
  )
where is_recurring = true;

update public.transactions
set
  recurrence_frequency = null,
  recurrence_start_date = null,
  recurrence_end_date = null
where is_recurring = false;

create or replace function public.normalize_transaction_recurrence()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_recurring then
    new.recurrence_frequency :=
      coalesce(
        new.recurrence_frequency,
        'monthly'
      );

    new.recurrence_start_date :=
      coalesce(
        new.recurrence_start_date,
        new.transaction_date
      );

    if
      new.recurrence_end_date is not null
      and new.recurrence_end_date <
        new.recurrence_start_date
    then
      raise exception using
        errcode = '23514',
        message =
          'The recurrence end date cannot be before the start date.';
    end if;
  else
    new.recurrence_frequency := null;
    new.recurrence_start_date := null;
    new.recurrence_end_date := null;
  end if;

  return new;
end;
$$;

drop trigger if exists
  normalize_transaction_recurrence_trigger
on public.transactions;

create trigger
  normalize_transaction_recurrence_trigger
before insert or update of
  is_recurring,
  recurrence_frequency,
  recurrence_start_date,
  recurrence_end_date,
  transaction_date
on public.transactions
for each row
execute function
  public.normalize_transaction_recurrence();

alter table public.transactions
drop constraint if exists
  transactions_recurrence_frequency_check;

alter table public.transactions
add constraint
  transactions_recurrence_frequency_check
check (
  recurrence_frequency is null
  or recurrence_frequency in (
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
  )
);

alter table public.transactions
drop constraint if exists
  transactions_recurrence_consistency_check;

alter table public.transactions
add constraint
  transactions_recurrence_consistency_check
check (
  (
    is_recurring = false
    and recurrence_frequency is null
    and recurrence_start_date is null
    and recurrence_end_date is null
  )
  or
  (
    is_recurring = true
    and recurrence_frequency is not null
    and recurrence_start_date is not null
    and (
      recurrence_end_date is null
      or recurrence_end_date >=
        recurrence_start_date
    )
  )
);

create index if not exists
  transactions_recurring_projection_index
on public.transactions (
  user_id,
  recurrence_start_date,
  recurrence_end_date
)
where is_recurring = true;

commit;