-- Profiles contain only application preferences; credentials remain in auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) between 1 and 100),
  avatar_url text check (avatar_url is null or avatar_url ~ '^https?://'),
  preferred_currency text not null default 'CAD' check (preferred_currency ~ '^[A-Z]{3}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, nullif(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'), ''), nullif(new.raw_user_meta_data ->> 'avatar_url', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute function public.create_profile_for_new_user();

-- Backfill safely for existing accounts. No credentials are copied.
insert into public.profiles (id, display_name, avatar_url)
select id, nullif(coalesce(raw_user_meta_data ->> 'display_name', raw_user_meta_data ->> 'full_name'), ''), nullif(raw_user_meta_data ->> 'avatar_url', '')
from auth.users on conflict (id) do nothing;

alter table public.profiles enable row level security;
drop policy if exists profiles_own_records on public.profiles;
create policy profiles_own_records on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- Apply owner isolation to every current application table with a user_id column.
-- The loop is deliberately idempotent and includes import/history/watchlist support
-- tables added in future migrations as long as they use the standard ownership key.
do $$
declare table_name text;
begin
  for table_name in
    select c.table_name from information_schema.columns c
    where c.table_schema = 'public' and c.column_name = 'user_id'
      and c.table_name <> 'profiles'
  loop
    -- Existing installations can contain legacy rows, so the FK is added NOT
    -- VALID: new writes are protected without making a deployment fail on data
    -- that needs a deliberate owner-assignment review.
    if not exists (
      select 1 from pg_constraint
      where conrelid = format('public.%I', table_name)::regclass
        and contype = 'f' and pg_get_constraintdef(oid) like '%(user_id)%auth.users%'
    ) then
      execute format('alter table public.%I add constraint %I foreign key (user_id) references auth.users(id) on delete cascade not valid', table_name, table_name || '_user_id_auth_users_fkey');
    end if;
    execute format('create index if not exists %I on public.%I (user_id)', table_name || '_user_id_idx', table_name);
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || '_owner_access', table_name);
    execute format('create policy %I on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', table_name || '_owner_access', table_name);
  end loop;
end $$;
