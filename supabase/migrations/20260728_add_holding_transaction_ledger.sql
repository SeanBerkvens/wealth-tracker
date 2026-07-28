-- Link each transaction to the holding it changes and retain the metadata
-- required for the holding-level transaction editor.
alter table public.transactions
  add column if not exists investment_id uuid references public.investments(id) on delete set null,
  add column if not exists commission numeric not null default 0 check (commission >= 0),
  add column if not exists note text;

-- Existing holdings are currently unique by user and symbol. A holding must
-- instead be unique within a portfolio so the same ticker can be tracked in
-- more than one account.
drop index if exists public.investments_user_id_symbol_key;

create unique index if not exists investments_user_id_portfolio_symbol_key
  on public.investments (user_id, coalesce(portfolio, ''), symbol);

-- Backfill the relationship for the existing single-holding-per-symbol data.
update public.transactions as transaction_entry
set investment_id = investment_entry.id
from public.investments as investment_entry
where transaction_entry.investment_id is null
  and transaction_entry.user_id = investment_entry.user_id
  and transaction_entry.symbol = investment_entry.symbol;

create or replace function public.recalculate_investment_from_transactions(
  target_investment_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  transaction_entry record;
  holding_shares numeric := 0;
  average_cost numeric := 0;
  total_cost numeric := 0;
  market_price numeric;
begin
  select current_price
  into market_price
  from public.investments
  where id = target_investment_id;

  if not found then
    return;
  end if;

  for transaction_entry in
    select id, type, shares, price, commission
    from public.transactions
    where investment_id = target_investment_id
    order by date, created_at, id
  loop
    if transaction_entry.type = 'buy' then
      total_cost := total_cost
        + (transaction_entry.shares * transaction_entry.price)
        + coalesce(transaction_entry.commission, 0);
      holding_shares := holding_shares + transaction_entry.shares;
      average_cost := total_cost / holding_shares;
    elsif transaction_entry.type = 'sell' then
      if transaction_entry.shares > holding_shares then
        raise exception 'A sale cannot exceed the shares held on that date';
      end if;

      holding_shares := holding_shares - transaction_entry.shares;
      total_cost := holding_shares * average_cost;
    else
      raise exception 'Unsupported transaction type: %', transaction_entry.type;
    end if;
  end loop;

  if holding_shares = 0 then
    delete from public.investments where id = target_investment_id;
  else
    update public.investments
    set shares = holding_shares,
        purchase_price = average_cost,
        value = holding_shares * coalesce(market_price, average_cost),
        purchase_date = (
          select min(date)
          from public.transactions
          where investment_id = target_investment_id
        )
    where id = target_investment_id;
  end if;
end;
$$;

create or replace function public.sync_investment_from_transaction()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') and old.investment_id is not null then
    perform public.recalculate_investment_from_transactions(old.investment_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') and new.investment_id is not null then
    perform public.recalculate_investment_from_transactions(new.investment_id);
  end if;

  return null;
end;
$$;

drop trigger if exists sync_investment_from_transaction on public.transactions;

create trigger sync_investment_from_transaction
after insert or update or delete on public.transactions
for each row execute function public.sync_investment_from_transaction();

do $$
declare
  investment_entry record;
begin
  for investment_entry in
    select id from public.investments
  loop
    perform public.recalculate_investment_from_transactions(investment_entry.id);
  end loop;
end;
$$;
