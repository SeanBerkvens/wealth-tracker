-- Record stock splits as ledger events. `shares` is the split multiplier
-- (for example 2 for a 2-for-1 split, or 0.1 for a 1-for-10 reverse split).
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
  select current_price into market_price from public.investments where id = target_investment_id;
  if not found then return; end if;

  for transaction_entry in
    select id, type, shares, price, commission
    from public.transactions
    where investment_id = target_investment_id
    order by date, created_at, id
  loop
    if transaction_entry.type = 'buy' then
      total_cost := total_cost + (transaction_entry.shares * transaction_entry.price) + coalesce(transaction_entry.commission, 0);
      holding_shares := holding_shares + transaction_entry.shares;
      average_cost := total_cost / holding_shares;
    elsif transaction_entry.type = 'sell' then
      if transaction_entry.shares > holding_shares then
        raise exception 'A sale cannot exceed the shares held on that date';
      end if;
      holding_shares := holding_shares - transaction_entry.shares;
      total_cost := holding_shares * average_cost;
    elsif transaction_entry.type = 'split' then
      if transaction_entry.shares <= 0 then
        raise exception 'A stock split ratio must be positive';
      end if;
      holding_shares := holding_shares * transaction_entry.shares;
      average_cost := average_cost / transaction_entry.shares;
      -- total_cost is unchanged by a stock split.
    elsif transaction_entry.type = 'subdivision' then
      -- Wealthsimple's SUBDIVISION activity is an additive share correction,
      -- not a ratio. Its `shares` value can be positive or negative.
      holding_shares := holding_shares + transaction_entry.shares;
      if holding_shares < 0 then
        raise exception 'A share correction cannot reduce a holding below zero';
      end if;
      if holding_shares > 0 then
        average_cost := total_cost / holding_shares;
      else
        average_cost := 0;
      end if;
    else
      raise exception 'Unsupported transaction type: %', transaction_entry.type;
    end if;
  end loop;

  update public.investments
  set shares = holding_shares,
      purchase_price = case when holding_shares > 0 then average_cost else 0 end,
      value = holding_shares * coalesce(market_price, average_cost),
      purchase_date = (select min(date) from public.transactions where investment_id = target_investment_id)
  where id = target_investment_id;
end;
$$;
