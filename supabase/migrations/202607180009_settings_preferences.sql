begin;

alter table public.user_preferences
add column if not exists full_name text;

alter table public.user_preferences
add column if not exists timezone text
not null default 'UTC';

alter table public.user_preferences
add column if not exists date_format text
not null default 'MMM d, yyyy';

alter table public.user_preferences
add column if not exists ai_enabled boolean
not null default true;

alter table public.user_preferences
add column if not exists ai_context_mode text
not null default 'aggregated';

alter table public.user_preferences
drop constraint if exists
  user_preferences_full_name_length_check;

alter table public.user_preferences
add constraint
  user_preferences_full_name_length_check
check (
  full_name is null
  or length(trim(full_name))
    between 2 and 100
);

alter table public.user_preferences
drop constraint if exists
  user_preferences_timezone_length_check;

alter table public.user_preferences
add constraint
  user_preferences_timezone_length_check
check (
  length(timezone)
    between 1 and 100
);

alter table public.user_preferences
drop constraint if exists
  user_preferences_date_format_check;

alter table public.user_preferences
add constraint
  user_preferences_date_format_check
check (
  date_format in (
    'MMM d, yyyy',
    'd MMM yyyy',
    'dd/MM/yyyy',
    'MM/dd/yyyy',
    'yyyy-MM-dd'
  )
);

alter table public.user_preferences
drop constraint if exists
  user_preferences_ai_context_mode_check;

alter table public.user_preferences
add constraint
  user_preferences_ai_context_mode_check
check (
  ai_context_mode in (
    'aggregated',
    'disabled'
  )
);

commit;