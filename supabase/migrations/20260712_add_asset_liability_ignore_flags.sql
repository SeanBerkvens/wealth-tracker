alter table public.assets
  add column if not exists is_ignored boolean not null default false;

alter table public.liabilities
  add column if not exists is_ignored boolean not null default false;

alter table public.accounts
  add column if not exists is_ignored boolean not null default false;

alter table public.portfolios
  add column if not exists is_ignored boolean not null default false;

alter table public.investments
  add column if not exists is_ignored boolean not null default false;
