begin;

create extension if not exists pg_trgm;

-- =========================================================
-- DESTINATION ACCOUNT
-- =========================================================

alter table public.transactions
add column if not exists destination_account_id uuid;

alter table public.transactions
drop constraint if exists transactions_destination_account_id_fkey;

alter table public.transactions
add constraint transactions_destination_account_id_fkey
foreign key (destination_account_id)
references public.accounts(id)
on delete restrict;

alter table public.transactions
drop constraint if exists transactions_distinct_accounts;

alter table public.transactions
add constraint transactions_distinct_accounts
check (
  destination_account_id is null
  or destination_account_id <> account_id
);

create index if not exists
  transactions_destination_account_index
on public.transactions (
  destination_account_id,
  transaction_date desc
);

-- =========================================================
-- SEARCH COLUMN
-- =========================================================

alter table public.transactions
add column if not exists search_text text
generated always as (
  lower(
    coalesce(description, '')
    || ' '
    || coalesce(merchant, '')
    || ' '
    || coalesce(notes, '')
  )
) stored;

create index if not exists
  transactions_search_text_index
on public.transactions
using gin (search_text gin_trgm_ops);

-- =========================================================
-- TRANSACTION INTEGRITY
-- =========================================================

create or replace function public.validate_transaction_integrity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  source_type public.account_type;
  source_currency public.currency_code;
  destination_type public.account_type;
  destination_currency public.currency_code;
  selected_category_kind public.category_kind;
begin
  select
    account_type,
    currency
  into
    source_type,
    source_currency
  from public.accounts
  where id = new.account_id
    and user_id = new.user_id;

  if not found then
    raise exception using
      errcode = '23514',
      message = 'The selected source account is invalid.';
  end if;

  if new.currency <> source_currency then
    raise exception using
      errcode = '23514',
      message = 'The transaction currency must match the source account.';
  end if;

  if new.category_id is not null then
    select kind
    into selected_category_kind
    from public.categories
    where id = new.category_id
      and user_id = new.user_id;

    if not found then
      raise exception using
        errcode = '23514',
        message = 'The selected category is invalid.';
    end if;
  end if;

  if new.transaction_kind in ('income', 'expense') then
    if source_type = 'loan' then
      raise exception using
        errcode = '23514',
        message = 'Income and expenses cannot use a loan as the source account.';
    end if;

    if new.destination_account_id is not null then
      raise exception using
        errcode = '23514',
        message = 'Income and expense transactions cannot have a destination account.';
    end if;

    if new.category_id is null then
      raise exception using
        errcode = '23514',
        message = 'Income and expense transactions require a category.';
    end if;

    if
      new.transaction_kind = 'income'
      and selected_category_kind <> 'income'
    then
      raise exception using
        errcode = '23514',
        message = 'Income transactions require an income category.';
    end if;

    if
      new.transaction_kind = 'expense'
      and selected_category_kind <> 'expense'
    then
      raise exception using
        errcode = '23514',
        message = 'Expense transactions require an expense category.';
    end if;
  elsif new.transaction_kind = 'loan_payment' then
    if source_type = 'loan' then
      raise exception using
        errcode = '23514',
        message = 'A loan payment must be paid from a bank or cash account.';
    end if;

    if new.destination_account_id is null then
      raise exception using
        errcode = '23514',
        message = 'A loan payment requires a destination loan account.';
    end if;

    select
      account_type,
      currency
    into
      destination_type,
      destination_currency
    from public.accounts
    where id = new.destination_account_id
      and user_id = new.user_id;

    if not found then
      raise exception using
        errcode = '23514',
        message = 'The selected loan account is invalid.';
    end if;

    if destination_type <> 'loan' then
      raise exception using
        errcode = '23514',
        message = 'The destination account must be a loan.';
    end if;

    if destination_currency <> source_currency then
      raise exception using
        errcode = '23514',
        message = 'Cross-currency loan payments are not available yet.';
    end if;

    if
      new.category_id is null
      or selected_category_kind <> 'expense'
    then
      raise exception using
        errcode = '23514',
        message = 'Loan payments require an expense category.';
    end if;
  elsif new.transaction_kind = 'transfer' then
    if source_type = 'loan' then
      raise exception using
        errcode = '23514',
        message = 'A loan cannot be used as a transfer source.';
    end if;

    if new.destination_account_id is null then
      raise exception using
        errcode = '23514',
        message = 'A transfer requires a destination account.';
    end if;

    select
      account_type,
      currency
    into
      destination_type,
      destination_currency
    from public.accounts
    where id = new.destination_account_id
      and user_id = new.user_id;

    if not found then
      raise exception using
        errcode = '23514',
        message = 'The destination account is invalid.';
    end if;

    if destination_type = 'loan' then
      raise exception using
        errcode = '23514',
        message = 'Use a loan payment instead of a transfer.';
    end if;

    if destination_currency <> source_currency then
      raise exception using
        errcode = '23514',
        message = 'Cross-currency transfers are not available yet.';
    end if;

    if new.category_id is not null then
      raise exception using
        errcode = '23514',
        message = 'Transfers cannot have an income or expense category.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_transaction_integrity_trigger
on public.transactions;

create trigger validate_transaction_integrity_trigger
before insert or update
on public.transactions
for each row
execute function public.validate_transaction_integrity();

-- =========================================================
-- CALCULATED ACCOUNT BALANCES
-- =========================================================

drop view if exists public.account_balances;

create view public.account_balances
with (security_invoker = true)
as
with source_activity as (
  select
    account_id,
    sum(
      case
        when transaction_kind = 'income'
          then amount
        when transaction_kind in (
          'expense',
          'loan_payment',
          'transfer'
        )
          then -amount
        else 0
      end
    ) as balance_delta,
    count(*) as transaction_count
  from public.transactions
  group by account_id
),
destination_activity as (
  select
    destination_account_id as account_id,
    sum(
      case
        when transaction_kind = 'transfer'
          then amount
        when transaction_kind = 'loan_payment'
          then -amount
        else 0
      end
    ) as balance_delta,
    count(*) as transaction_count
  from public.transactions
  where destination_account_id is not null
  group by destination_account_id
)
select
  a.id,
  a.user_id,
  a.name,
  a.institution,
  a.account_type,
  a.country,
  a.currency,
  a.opening_balance,
  a.opening_balance_date,
  a.is_active,
  a.created_at,
  a.updated_at,

  (
    a.opening_balance
    + coalesce(source_activity.balance_delta, 0)
    + coalesce(destination_activity.balance_delta, 0)
  )::numeric(18, 2) as current_balance,

  (
    coalesce(source_activity.transaction_count, 0)
    + coalesce(destination_activity.transaction_count, 0)
  )::bigint as transaction_count

from public.accounts a
left join source_activity
  on source_activity.account_id = a.id
left join destination_activity
  on destination_activity.account_id = a.id;

grant select
on public.account_balances
to authenticated;

revoke all
on public.account_balances
from anon;

commit;