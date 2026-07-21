-- Add user_id column to all tables
alter table public.accounts
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.assets
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.liabilities
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.investments
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.portfolios
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.transactions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.net_worth_history
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Backfill existing data with the current user's ID
-- Replace 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' with your actual user ID if different
update public.accounts set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.assets set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.liabilities set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.investments set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.portfolios set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.transactions set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;
update public.net_worth_history set user_id = 'a618998d-1b53-4f6b-9f3a-486b20a1ea4d' where user_id is null;

-- Make user_id NOT NULL after backfill
alter table public.accounts alter column user_id set not null;
alter table public.assets alter column user_id set not null;
alter table public.liabilities alter column user_id set not null;
alter table public.investments alter column user_id set not null;
alter table public.portfolios alter column user_id set not null;
alter table public.transactions alter column user_id set not null;
alter table public.net_worth_history alter column user_id set not null;

-- Enable Row Level Security on all tables
alter table public.accounts enable row level security;
alter table public.assets enable row level security;
alter table public.liabilities enable row level security;
alter table public.investments enable row level security;
alter table public.portfolios enable row level security;
alter table public.transactions enable row level security;
alter table public.net_worth_history enable row level security;

-- Drop existing policies if they exist (for idempotency)
drop policy if exists "Users can view their own accounts" on public.accounts;
drop policy if exists "Users can insert their own accounts" on public.accounts;
drop policy if exists "Users can update their own accounts" on public.accounts;
drop policy if exists "Users can delete their own accounts" on public.accounts;

drop policy if exists "Users can view their own assets" on public.assets;
drop policy if exists "Users can insert their own assets" on public.assets;
drop policy if exists "Users can update their own assets" on public.assets;
drop policy if exists "Users can delete their own assets" on public.assets;

drop policy if exists "Users can view their own liabilities" on public.liabilities;
drop policy if exists "Users can insert their own liabilities" on public.liabilities;
drop policy if exists "Users can update their own liabilities" on public.liabilities;
drop policy if exists "Users can delete their own liabilities" on public.liabilities;

drop policy if exists "Users can view their own investments" on public.investments;
drop policy if exists "Users can insert their own investments" on public.investments;
drop policy if exists "Users can update their own investments" on public.investments;
drop policy if exists "Users can delete their own investments" on public.investments;

drop policy if exists "Users can view their own portfolios" on public.portfolios;
drop policy if exists "Users can insert their own portfolios" on public.portfolios;
drop policy if exists "Users can update their own portfolios" on public.portfolios;
drop policy if exists "Users can delete their own portfolios" on public.portfolios;

drop policy if exists "Users can view their own transactions" on public.transactions;
drop policy if exists "Users can insert their own transactions" on public.transactions;
drop policy if exists "Users can update their own transactions" on public.transactions;
drop policy if exists "Users can delete their own transactions" on public.transactions;

drop policy if exists "Users can view their own net worth history" on public.net_worth_history;
drop policy if exists "Users can insert their own net worth history" on public.net_worth_history;
drop policy if exists "Users can update their own net worth history" on public.net_worth_history;
drop policy if exists "Users can delete their own net worth history" on public.net_worth_history;

-- Create RLS policies for accounts
create policy "Users can view their own accounts"
  on public.accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own accounts"
  on public.accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own accounts"
  on public.accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own accounts"
  on public.accounts for delete
  using (auth.uid() = user_id);

-- Create RLS policies for assets
create policy "Users can view their own assets"
  on public.assets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own assets"
  on public.assets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own assets"
  on public.assets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own assets"
  on public.assets for delete
  using (auth.uid() = user_id);

-- Create RLS policies for liabilities
create policy "Users can view their own liabilities"
  on public.liabilities for select
  using (auth.uid() = user_id);

create policy "Users can insert their own liabilities"
  on public.liabilities for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own liabilities"
  on public.liabilities for update
  using (auth.uid() = user_id);

create policy "Users can delete their own liabilities"
  on public.liabilities for delete
  using (auth.uid() = user_id);

-- Create RLS policies for investments
create policy "Users can view their own investments"
  on public.investments for select
  using (auth.uid() = user_id);

create policy "Users can insert their own investments"
  on public.investments for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own investments"
  on public.investments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own investments"
  on public.investments for delete
  using (auth.uid() = user_id);

-- Create RLS policies for portfolios
create policy "Users can view their own portfolios"
  on public.portfolios for select
  using (auth.uid() = user_id);

create policy "Users can insert their own portfolios"
  on public.portfolios for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own portfolios"
  on public.portfolios for update
  using (auth.uid() = user_id);

create policy "Users can delete their own portfolios"
  on public.portfolios for delete
  using (auth.uid() = user_id);

-- Create RLS policies for transactions
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Create RLS policies for net_worth_history
create policy "Users can view their own net worth history"
  on public.net_worth_history for select
  using (auth.uid() = user_id);

create policy "Users can insert their own net worth history"
  on public.net_worth_history for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own net worth history"
  on public.net_worth_history for update
  using (auth.uid() = user_id);

create policy "Users can delete their own net worth history"
  on public.net_worth_history for delete
  using (auth.uid() = user_id);