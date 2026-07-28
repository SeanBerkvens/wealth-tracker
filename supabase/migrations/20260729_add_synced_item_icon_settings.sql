alter table public.accounts
  add column if not exists icon text not null default 'landmark',
  add column if not exists icon_color text not null default '#06b6d4';

alter table public.portfolios
  add column if not exists icon text not null default 'trending-up',
  add column if not exists icon_color text not null default '#06b6d4';
