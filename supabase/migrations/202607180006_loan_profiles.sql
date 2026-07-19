begin;

create table if not exists public.loan_profiles (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  account_id uuid not null
    references public.accounts(id)
    on delete cascade,

  lender text,

  original_principal numeric(18, 2),

  annual_interest_rate numeric(8, 5)
    not null,

  required_monthly_payment numeric(18, 2)
    not null,

  next_payment_date date not null,

  original_term_months integer,

  rate_type text not null
    default 'variable',

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint loan_profiles_account_unique
    unique (account_id),

  constraint loan_profiles_lender_length
    check (
      lender is null
      or length(trim(lender)) between 1 and 100
    ),

  constraint loan_profiles_original_principal_positive
    check (
      original_principal is null
      or original_principal > 0
    ),

  constraint loan_profiles_interest_rate_range
    check (
      annual_interest_rate >= 0
      and annual_interest_rate <= 100
    ),

  constraint loan_profiles_monthly_payment_positive
    check (
      required_monthly_payment > 0
    ),

  constraint loan_profiles_original_term_range
    check (
      original_term_months is null
      or original_term_months between 1 and 600
    ),

  constraint loan_profiles_rate_type_check
    check (
      rate_type in (
        'fixed',
        'variable'
      )
    )
);

create index if not exists
  loan_profiles_user_index
on public.loan_profiles (
  user_id,
  created_at desc
);

create or replace function
  public.validate_loan_profile_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account_type
    public.account_type;
begin
  select account_type
  into selected_account_type
  from public.accounts
  where id = new.account_id
    and user_id = new.user_id;

  if not found then
    raise exception using
      errcode = '23514',
      message =
        'The selected loan account is invalid.';
  end if;

  if selected_account_type <> 'loan' then
    raise exception using
      errcode = '23514',
      message =
        'A loan profile must be attached to a loan account.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  validate_loan_profile_account_trigger
on public.loan_profiles;

create trigger
  validate_loan_profile_account_trigger
before insert or update
on public.loan_profiles
for each row
execute function
  public.validate_loan_profile_account();

create or replace function
  public.set_loan_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists
  set_loan_profile_updated_at_trigger
on public.loan_profiles;

create trigger
  set_loan_profile_updated_at_trigger
before update
on public.loan_profiles
for each row
execute function
  public.set_loan_profile_updated_at();

alter table public.loan_profiles
enable row level security;

drop policy if exists
  "Users manage their own loan profiles"
on public.loan_profiles;

create policy
  "Users manage their own loan profiles"
on public.loan_profiles
for all
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

grant
  select,
  insert,
  update,
  delete
on public.loan_profiles
to authenticated;

revoke all
on public.loan_profiles
from anon;

commit;