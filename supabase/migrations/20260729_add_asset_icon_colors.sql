-- Kept separate from the initial icon migration so existing deployments receive
-- the color fields even if that migration has already been applied.
alter table public.assets
  add column if not exists icon_color text not null default '#06b6d4';

alter table public.liabilities
  add column if not exists icon_color text not null default '#ef4444';
