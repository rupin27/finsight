begin;

create table if not exists public.financial_goal_plans (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  name text not null,

  goal_type text not null,

  progress_source text not null
    default 'manual',

  target_amount numeric(18, 2),

  manual_current_amount numeric(18, 2)
    not null
    default 0,

  currency text not null,

  target_date date,

  linked_account_id uuid
    references public.accounts(id)
    on delete restrict,

  baseline_amount numeric(18, 2),

  planned_monthly_contribution numeric(18, 2)
    not null
    default 0,

  emergency_fund_months integer,

  priority integer not null
    default 3,

  status text not null
    default 'active',

  notes text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint financial_goal_plans_name_length
    check (
      length(trim(name))
      between 2 and 100
    ),

  constraint financial_goal_plans_type_check
    check (
      goal_type in (
        'savings',
        'emergency_fund',
        'loan_payoff',
        'custom'
      )
    ),

  constraint financial_goal_plans_progress_source_check
    check (
      progress_source in (
        'manual',
        'linked_account'
      )
    ),

  constraint financial_goal_plans_currency_check
    check (
      currency in (
        'USD',
        'EUR',
        'INR'
      )
    ),

  constraint financial_goal_plans_target_amount_check
    check (
      target_amount is null
      or target_amount > 0
    ),

  constraint financial_goal_plans_manual_amount_check
    check (
      manual_current_amount >= 0
    ),

  constraint financial_goal_plans_baseline_check
    check (
      baseline_amount is null
      or baseline_amount > 0
    ),

  constraint financial_goal_plans_contribution_check
    check (
      planned_monthly_contribution >= 0
    ),

  constraint financial_goal_plans_emergency_months_check
    check (
      emergency_fund_months is null
      or emergency_fund_months
        between 1 and 24
    ),

  constraint financial_goal_plans_priority_check
    check (
      priority between 1 and 5
    ),

  constraint financial_goal_plans_status_check
    check (
      status in (
        'active',
        'archived'
      )
    ),

  constraint financial_goal_plans_notes_length
    check (
      notes is null
      or length(notes) <= 1000
    ),

  constraint financial_goal_plans_type_fields_check
    check (
      (
        goal_type in (
          'savings',
          'custom'
        )
        and target_amount is not null
      )
      or
      (
        goal_type = 'emergency_fund'
        and emergency_fund_months
          is not null
      )
      or
      (
        goal_type = 'loan_payoff'
        and progress_source =
          'linked_account'
        and linked_account_id
          is not null
        and baseline_amount
          is not null
      )
    ),

  constraint financial_goal_plans_progress_fields_check
    check (
      (
        progress_source = 'manual'
        and linked_account_id is null
      )
      or
      (
        progress_source =
          'linked_account'
        and linked_account_id
          is not null
      )
    )
);

create index if not exists
  financial_goal_plans_user_status_index
on public.financial_goal_plans (
  user_id,
  status,
  priority,
  created_at
);

create index if not exists
  financial_goal_plans_account_index
on public.financial_goal_plans (
  linked_account_id
)
where linked_account_id is not null;

create or replace function
  public.validate_financial_goal_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_account_type
    public.account_type;
begin
  if new.linked_account_id is null then
    return new;
  end if;

  select account_type
  into selected_account_type
  from public.accounts
  where id = new.linked_account_id
    and user_id = new.user_id;

  if not found then
    raise exception using
      errcode = '23514',
      message =
        'The linked account is invalid.';
  end if;

  if
    new.goal_type = 'loan_payoff'
    and selected_account_type <> 'loan'
  then
    raise exception using
      errcode = '23514',
      message =
        'Loan-payoff goals must link to a loan account.';
  end if;

  if
    new.goal_type <> 'loan_payoff'
    and selected_account_type = 'loan'
  then
    raise exception using
      errcode = '23514',
      message =
        'Savings goals cannot use a loan account for progress.';
  end if;

  return new;
end;
$$;

drop trigger if exists
  validate_financial_goal_account_trigger
on public.financial_goal_plans;

create trigger
  validate_financial_goal_account_trigger
before insert or update
on public.financial_goal_plans
for each row
execute function
  public.validate_financial_goal_account();

create or replace function
  public.set_financial_goal_updated_at()
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
  set_financial_goal_updated_at_trigger
on public.financial_goal_plans;

create trigger
  set_financial_goal_updated_at_trigger
before update
on public.financial_goal_plans
for each row
execute function
  public.set_financial_goal_updated_at();

alter table public.financial_goal_plans
enable row level security;

drop policy if exists
  "Users manage their own financial goals"
on public.financial_goal_plans;

create policy
  "Users manage their own financial goals"
on public.financial_goal_plans
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
on public.financial_goal_plans
to authenticated;

revoke all
on public.financial_goal_plans
from anon;

commit;