begin;

create table if not exists public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  model text not null,

  status text not null
    default 'started',

  prompt_characters integer not null
    default 0,

  response_characters integer not null
    default 0,

  input_tokens integer,
  output_tokens integer,
  total_tokens integer,

  provider_request_id text,
  error_code text,

  created_at timestamptz not null
    default now(),

  updated_at timestamptz not null
    default now(),

  constraint ai_usage_status_check
    check (
      status in (
        'started',
        'completed',
        'failed'
      )
    ),

  constraint ai_usage_prompt_characters_check
    check (
      prompt_characters >= 0
    ),

  constraint ai_usage_response_characters_check
    check (
      response_characters >= 0
    ),

  constraint ai_usage_token_counts_check
    check (
      (
        input_tokens is null
        or input_tokens >= 0
      )
      and
      (
        output_tokens is null
        or output_tokens >= 0
      )
      and
      (
        total_tokens is null
        or total_tokens >= 0
      )
    )
);

create index if not exists
  ai_usage_events_user_created_index
on public.ai_usage_events (
  user_id,
  created_at desc
);

create or replace function
  public.set_ai_usage_updated_at()
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
  set_ai_usage_updated_at_trigger
on public.ai_usage_events;

create trigger
  set_ai_usage_updated_at_trigger
before update
on public.ai_usage_events
for each row
execute function
  public.set_ai_usage_updated_at();

alter table public.ai_usage_events
enable row level security;

drop policy if exists
  "Users read their own AI usage"
on public.ai_usage_events;

create policy
  "Users read their own AI usage"
on public.ai_usage_events
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

drop policy if exists
  "Users insert their own AI usage"
on public.ai_usage_events;

create policy
  "Users insert their own AI usage"
on public.ai_usage_events
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
);

drop policy if exists
  "Users update their own AI usage"
on public.ai_usage_events;

create policy
  "Users update their own AI usage"
on public.ai_usage_events
for update
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
  update
on public.ai_usage_events
to authenticated;

revoke all
on public.ai_usage_events
from anon;

commit;