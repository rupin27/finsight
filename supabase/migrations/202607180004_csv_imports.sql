begin;

create table if not exists public.csv_imports (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  account_id uuid
    references public.accounts(id)
    on delete set null,

  filename text not null,
  file_size_bytes integer not null default 0
    check (file_size_bytes >= 0),

  total_rows integer not null default 0
    check (total_rows >= 0),

  imported_rows integer not null default 0
    check (imported_rows >= 0),

  duplicate_rows integer not null default 0
    check (duplicate_rows >= 0),

  invalid_rows integer not null default 0
    check (invalid_rows >= 0),

  status text not null
    check (
      status in (
        'completed',
        'failed'
      )
    ),

  error_message text,

  created_at timestamptz not null default now(),

  constraint csv_imports_filename_not_empty
    check (length(trim(filename)) > 0)
);

create index if not exists
  csv_imports_user_created_index
on public.csv_imports (
  user_id,
  created_at desc
);

create unique index if not exists
  transactions_user_source_hash_unique
on public.transactions (
  user_id,
  source_row_hash
)
where source_row_hash is not null;

alter table public.csv_imports
enable row level security;

drop policy if exists
  "Users manage their CSV imports"
on public.csv_imports;

create policy
  "Users manage their CSV imports"
on public.csv_imports
for all
to authenticated
using (
  (select auth.uid()) = user_id
)
with check (
  (select auth.uid()) = user_id
);

grant select, insert, delete
on public.csv_imports
to authenticated;

commit;