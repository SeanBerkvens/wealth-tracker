alter table public.assets
  add column if not exists icon text not null default 'wallet';

alter table public.liabilities
  add column if not exists icon text not null default 'landmark';

alter table public.assets
  add column if not exists icon_color text not null default '#06b6d4';

alter table public.liabilities
  add column if not exists icon_color text not null default '#ef4444';
