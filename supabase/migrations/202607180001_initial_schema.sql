begin;

create extension if not exists pgcrypto;

-- =========================================================
-- ENUMS
-- =========================================================

do $$
begin
  create type public.currency_code as enum ('USD', 'EUR', 'INR');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.country_code as enum ('US', 'IE', 'IN');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.account_type as enum (
    'checking',
    'savings',
    'cash',
    'loan'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.category_kind as enum ('income', 'expense');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.transaction_kind as enum (
    'income',
    'expense',
    'loan_payment',
    'transfer'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.financial_goal_type as enum (
    'student_loan_payoff',
    'monthly_savings',
    'post_graduation_runway'
  );
exception
  when duplicate_object then null;
end
$$;

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  default_currency public.currency_code not null default 'USD',
  timezone text not null default 'UTC',
  monthly_savings_target numeric(18, 2)
    check (
      monthly_savings_target is null
      or monthly_savings_target >= 0
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  institution text,
  account_type public.account_type not null,
  country public.country_code not null,
  currency public.currency_code not null,

  opening_balance numeric(18, 2) not null default 0,
  opening_balance_date date not null default current_date,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint accounts_name_not_empty
    check (length(trim(name)) > 0),

  constraint accounts_user_name_unique
    unique (user_id, name)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  name text not null,
  kind public.category_kind not null,
  icon text,
  is_system boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint categories_name_not_empty
    check (length(trim(name)) > 0),

  constraint categories_user_name_kind_unique
    unique (user_id, name, kind)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  account_id uuid not null
    references public.accounts(id) on delete cascade,

  category_id uuid
    references public.categories(id) on delete set null,

  transaction_kind public.transaction_kind not null,

  amount numeric(18, 2) not null
    check (amount > 0),

  currency public.currency_code not null,
  transaction_date date not null,

  description text not null,
  merchant text,
  notes text,

  is_recurring boolean not null default false,

  -- The original transaction is always retained.
  -- These fields let us reproduce historical conversions.
  fx_rate_to_usd numeric(20, 10)
    check (
      fx_rate_to_usd is null
      or fx_rate_to_usd > 0
    ),

  fx_rate_date date,

  import_source text,
  source_row_hash text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint transactions_description_not_empty
    check (length(trim(description)) > 0)
);

create unique index if not exists
  transactions_user_source_hash_unique
on public.transactions (user_id, source_row_hash)
where source_row_hash is not null;

create index if not exists
  transactions_user_date_index
on public.transactions (user_id, transaction_date desc);

create index if not exists
  transactions_account_date_index
on public.transactions (account_id, transaction_date desc);

create index if not exists
  transactions_category_index
on public.transactions (category_id);

create table if not exists public.loans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  account_id uuid
    references public.accounts(id) on delete set null,

  lender text not null,
  name text not null,

  original_principal numeric(18, 2) not null
    check (original_principal > 0),

  outstanding_balance numeric(18, 2) not null
    check (outstanding_balance >= 0),

  annual_interest_rate numeric(8, 5) not null
    check (
      annual_interest_rate >= 0
      and annual_interest_rate <= 100
    ),

  minimum_monthly_payment numeric(18, 2) not null
    check (minimum_monthly_payment >= 0),

  currency public.currency_code not null,

  start_date date,
  term_months integer
    check (
      term_months is null
      or term_months > 0
    ),

  payment_day integer
    check (
      payment_day is null
      or payment_day between 1 and 31
    ),

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint loans_name_not_empty
    check (length(trim(name)) > 0),

  constraint loans_lender_not_empty
    check (length(trim(lender)) > 0)
);

create table if not exists public.financial_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  goal_type public.financial_goal_type not null,
  name text not null,

  target_amount numeric(18, 2) not null
    check (target_amount >= 0),

  current_amount numeric(18, 2) not null default 0
    check (current_amount >= 0),

  currency public.currency_code not null,
  target_date date,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint financial_goals_name_not_empty
    check (length(trim(name)) > 0)
);

-- =========================================================
-- UPDATED-AT TRIGGERS
-- =========================================================

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

drop trigger if exists profiles_set_updated_at
  on public.profiles;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists user_preferences_set_updated_at
  on public.user_preferences;

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

drop trigger if exists accounts_set_updated_at
  on public.accounts;

create trigger accounts_set_updated_at
before update on public.accounts
for each row
execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at
  on public.categories;

create trigger categories_set_updated_at
before update on public.categories
for each row
execute function public.set_updated_at();

drop trigger if exists transactions_set_updated_at
  on public.transactions;

create trigger transactions_set_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

drop trigger if exists loans_set_updated_at
  on public.loans;

create trigger loans_set_updated_at
before update on public.loans
for each row
execute function public.set_updated_at();

drop trigger if exists financial_goals_set_updated_at
  on public.financial_goals;

create trigger financial_goals_set_updated_at
before update on public.financial_goals
for each row
execute function public.set_updated_at();

-- =========================================================
-- NEW USER INITIALIZATION
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name
  )
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (
    user_id,
    default_currency,
    timezone
  )
  values (
    new.id,
    'USD',
    'UTC'
  )
  on conflict (user_id) do nothing;

  insert into public.categories (
    user_id,
    name,
    kind,
    icon,
    is_system
  )
  values
    (new.id, 'Salary',             'income',  'briefcase',      true),
    (new.id, 'Contractor Income',  'income',  'laptop',         true),
    (new.id, 'Bonus',              'income',  'sparkles',       true),
    (new.id, 'Interest',           'income',  'landmark',       true),
    (new.id, 'Refund',             'income',  'rotate-ccw',     true),
    (new.id, 'Other Income',       'income',  'circle-plus',    true),

    (new.id, 'Rent',               'expense', 'house',          true),
    (new.id, 'Groceries',          'expense', 'shopping-cart',  true),
    (new.id, 'Dining',             'expense', 'utensils',       true),
    (new.id, 'Transport',          'expense', 'train',          true),
    (new.id, 'Utilities',          'expense', 'zap',            true),
    (new.id, 'Shopping',           'expense', 'shopping-bag',   true),
    (new.id, 'Entertainment',      'expense', 'film',           true),
    (new.id, 'Healthcare',         'expense', 'heart-pulse',    true),
    (new.id, 'Education',          'expense', 'graduation-cap', true),
    (new.id, 'Loan Payment',       'expense', 'landmark',       true),
    (new.id, 'Travel',             'expense', 'plane',          true),
    (new.id, 'Subscriptions',      'expense', 'repeat',         true),
    (new.id, 'Taxes',              'expense', 'receipt-text',   true),
    (new.id, 'Other Expense',      'expense', 'circle-minus',   true)
  on conflict (user_id, name, kind) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created
  on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.loans enable row level security;
alter table public.financial_goals enable row level security;

drop policy if exists "Users manage their profile"
  on public.profiles;

create policy "Users manage their profile"
on public.profiles
for all
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

drop policy if exists "Users manage their preferences"
  on public.user_preferences;

create policy "Users manage their preferences"
on public.user_preferences
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their accounts"
  on public.accounts;

create policy "Users manage their accounts"
on public.accounts
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their categories"
  on public.categories;

create policy "Users manage their categories"
on public.categories
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their transactions"
  on public.transactions;

create policy "Users manage their transactions"
on public.transactions
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their loans"
  on public.loans;

create policy "Users manage their loans"
on public.loans
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users manage their financial goals"
  on public.financial_goals;

create policy "Users manage their financial goals"
on public.financial_goals
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;

grant select, insert, update, delete
on table
  public.profiles,
  public.user_preferences,
  public.accounts,
  public.categories,
  public.transactions,
  public.loans,
  public.financial_goals
to authenticated;

commit;