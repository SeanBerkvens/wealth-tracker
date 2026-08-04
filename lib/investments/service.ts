import type { SupabaseClient } from "@supabase/supabase-js";
import { getStockQuote } from "@/lib/yahoo";
import { normalizeCurrency } from "@/lib/currency-format";
import { getManualSearchCompanyName } from "@/lib/stock-search";

type HoldingInput = { symbol: string; name?: string; portfolio?: string | null; preferMarketName?: boolean };
type TransactionInput = { investmentId: string; date: string; type: "buy" | "sell" | "split" | "subdivision"; shares: number; price: number; commission?: number; note?: string | null };

async function sharesHeldOnDate(supabase: SupabaseClient, userId: string, investmentId: string, date: string) {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select("type, shares")
    .eq("investment_id", investmentId)
    .eq("user_id", userId)
    .lte("date", date)
    .order("date", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (transactions ?? []).reduce((held, transaction) => {
    const quantity = Math.abs(Number(transaction.shares) || 0);
    if (transaction.type === "buy") return held + quantity;
    if (transaction.type === "split") return held * quantity;
    if (transaction.type === "subdivision") return held + Number(transaction.shares);
    return held - quantity;
  }, 0);
}

export async function synchronizeHoldingFromTransactions(supabase: SupabaseClient, userId: string, investmentId: string) {
  const { data: holding, error: holdingError } = await supabase.from("investments").select("id, current_price").eq("id", investmentId).eq("user_id", userId).single();
  if (holdingError || !holding) throw new Error("Holding not found.");
  const { data: transactions, error: transactionsError } = await supabase.from("transactions").select("type, shares, price, commission").eq("investment_id", investmentId).eq("user_id", userId).order("date", { ascending: true }).order("created_at", { ascending: true });
  if (transactionsError) throw new Error(transactionsError.message);
  if (!(transactions?.length)) return holding;

  let shares = 0; let costBasis = 0;
  for (const transaction of transactions) {
    const quantity = Math.abs(Number(transaction.shares) || 0);
    if (transaction.type === "buy") {
      costBasis += quantity * Number(transaction.price) + (Number(transaction.commission) || 0);
      shares += quantity;
    } else if (transaction.type === "sell") {
      const sold = Math.min(shares, quantity);
      costBasis -= shares > 0 ? (costBasis / shares) * sold : 0;
      shares -= sold;
    } else if (transaction.type === "split") {
      shares *= quantity;
    } else if (transaction.type === "subdivision") {
      shares += Number(transaction.shares) || 0;
    }
  }
  const { error } = await supabase.from("investments").update({ shares, purchase_price: shares > 0 ? costBasis / shares : 0, value: shares * (Number(holding.current_price) || 0) }).eq("id", investmentId).eq("user_id", userId);
  if (error) throw new Error(error.message);
  return holding;
}

export async function createHolding(supabase: SupabaseClient, userId: string, input: HoldingInput) {
  const symbol = input.symbol.trim().toUpperCase();
  if (!symbol) throw new Error("A ticker symbol is required.");

  let existingQuery = supabase.from("investments").select("*").eq("user_id", userId).eq("symbol", symbol);
  existingQuery = input.portfolio ? existingQuery.eq("portfolio", input.portfolio) : existingQuery.is("portfolio", null);
  const { data: existing, error: existingError } = await existingQuery.maybeSingle();
  if (existingError) throw new Error(existingError.message);
  if (existing) {
    if (input.preferMarketName) {
      let marketName = await getManualSearchCompanyName(symbol);
      if (!marketName) {
        try { marketName = (await getStockQuote(symbol)).name ?? null; } catch { /* Preserve the existing name when lookup is unavailable. */ }
      }
      if (marketName && marketName !== existing.name) {
        const { data: updated } = await supabase.from("investments").update({ name: marketName }).eq("id", existing.id).select("*").single();
        return updated ?? existing;
      }
    }
    return existing;
  }

  let quote = { price: 0, currency: "CAD", name: undefined as string | undefined };
  const marketNamePromise = input.preferMarketName ? getManualSearchCompanyName(symbol) : Promise.resolve(null);
  try {
    const result = await getStockQuote(symbol);
    quote = { price: result.price, currency: result.currency, name: result.name };
  } catch {
    // A holding can be created when a quote is temporarily unavailable.
  }
  // Company-name lookup must not depend on the price request succeeding.
  const marketName = await marketNamePromise;
  const { data: holding, error } = await supabase.from("investments").insert({
    user_id: userId, symbol, name: marketName || quote.name || input.name?.trim() || symbol, portfolio: input.portfolio || null,
    shares: 0, purchase_price: 0, current_price: quote.price, value: 0,
    purchase_date: new Date().toISOString().slice(0, 10), currency: normalizeCurrency(quote.currency),
  }).select("*").single();
  if (error || !holding) throw new Error(error?.message ?? "Could not create holding.");
  return holding;
}

export async function recordHoldingTransaction(supabase: SupabaseClient, userId: string, input: TransactionInput) {
  let shares = Number(input.shares); const price = Number(input.price); const commission = Number(input.commission || 0);
  const validShares = input.type === "subdivision" ? Number.isFinite(shares) && shares !== 0 : Number.isFinite(shares) && shares > 0;
  const invalidFields = [
    !input.investmentId && "holding",
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) && "date",
    !["buy", "sell", "split", "subdivision"].includes(input.type) && "type",
    !validShares && "shares",
    (!Number.isFinite(price) || price < 0) && "price",
    (!Number.isFinite(commission) || commission < 0) && "commission",
  ].filter(Boolean);
  if (invalidFields.length) throw new Error(`Invalid transaction ${invalidFields.join(", ")}.`);

  const { data: holding, error: holdingError } = await supabase.from("investments").select("id, symbol, currency").eq("id", input.investmentId).eq("user_id", userId).single();
  if (holdingError || !holding) throw new Error("Holding not found.");

  // Keep the stored balance in sync before inserting. Database sale validation
  // uses this balance, so later CSV sells see all earlier imported buys.
  await synchronizeHoldingFromTransactions(supabase, userId, input.investmentId);

  if (input.type === "sell") {
    const heldOnDate = await sharesHeldOnDate(supabase, userId, input.investmentId, input.date);
    const tolerance = 0.00000001;
    if (shares > heldOnDate + tolerance) {
      throw new Error(`A sale cannot exceed the shares held on that date. Available: ${heldOnDate}; requested: ${shares}.`);
    }

    // The database's sale guard reads the denormalized holding balance. Set it
    // to the historical balance it is about to validate, and use that exact
    // value for a complete close to avoid decimal precision false failures.
    if (Math.abs(shares - heldOnDate) <= tolerance) shares = heldOnDate;
    const { error: balanceError } = await supabase.from("investments")
      .update({ shares: heldOnDate })
      .eq("id", input.investmentId)
      .eq("user_id", userId);
    if (balanceError) throw new Error(balanceError.message);
  }

  const { data: transaction, error } = await supabase.from("transactions").insert({
    user_id: userId, investment_id: holding.id, symbol: holding.symbol, currency: normalizeCurrency(holding.currency),
    date: input.date, type: input.type, shares, price, commission, note: input.note?.trim() || null,
  }).select("id").single();
  if (error || !transaction) throw new Error(error?.message ?? "Could not save transaction.");
  await synchronizeHoldingFromTransactions(supabase, userId, input.investmentId);
  return transaction;
}
