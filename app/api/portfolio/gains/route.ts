import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getStockQuote } from "@/lib/yahoo";
import { getExchangeRate, normalizeCurrency } from "@/lib/currency";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const portfolio = searchParams.get("portfolio");

    // Create authenticated server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const reportingCurrency = normalizeCurrency(user.user_metadata?.preferred_currency);

    let query = supabase.from("investments").select("*").eq("user_id", userId);
    if (portfolio) {
      query = query.eq("portfolio", portfolio);
    }
    const { data: investments } = await query;

    if (!investments || investments.length === 0) {
      return NextResponse.json({
        todayGainValue: 0,
        todayGainPercent: 0,
        unrealizedGainValue: 0,
        unrealizedGainPercent: 0,
        bookValue: 0,
        netDeposits: 0,
        realizedGainValue: 0,
        realizedGainPercent: 0,
      });
    }

    let todayGainValue = 0;
    let portfolioValueYesterday = 0;
    let unrealizedGainValue = 0;
    let bookValue = 0;
    let realizedGainValue = 0;
    let realizedCost = 0;

    for (const investment of investments) {
      const shares = Number(investment.shares);
      const purchasePrice = Number(investment.purchase_price);

      try {
        const quote = await getStockQuote(investment.symbol);
        const rate = await getExchangeRate(investment.currency ?? quote.currency, reportingCurrency);

        // Today's gain: shares * change
        todayGainValue += shares * quote.change * rate;

        // Portfolio value at yesterday's close: shares * (price - change)
        portfolioValueYesterday += shares * (quote.price - quote.change) * rate;

        // Unrealized gain: shares * (current_price - purchase_price)
        unrealizedGainValue += shares * (quote.price - purchasePrice) * rate;

        bookValue += shares * purchasePrice * rate;
      } catch (err) {
        console.error(
          `Failed to fetch quote for ${investment.symbol}:`,
          err
        );
      }
    }

    const todayGainPercent =
      portfolioValueYesterday > 0
        ? (todayGainValue / portfolioValueYesterday) * 100
        : 0;

    const unrealizedGainPercent =
      bookValue > 0
        ? (unrealizedGainValue / bookValue) * 100
        : 0;

    const investmentIds = investments.map((investment) => investment.id);
    const { data: transactions } = await supabase
      .from("transactions")
      .select("investment_id, type, shares, price, commission, currency")
      .eq("user_id", userId)
      .in("investment_id", investmentIds)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });
    const ledgers = new Map<string, { shares: number; costBasis: number; currency: string }>();
    const investmentById = new Map(investments.map((investment) => [investment.id, investment]));
    const rateCache = new Map<string, number>();
    const rateFor = async (currency: string) => {
      const normalized = normalizeCurrency(currency);
      if (!rateCache.has(normalized)) rateCache.set(normalized, await getExchangeRate(normalized, reportingCurrency));
      return rateCache.get(normalized) ?? 1;
    };
    for (const transaction of transactions ?? []) {
      if (!transaction.investment_id) continue;
      const investment = investmentById.get(transaction.investment_id);
      if (!investment) continue;
      const ledger = ledgers.get(transaction.investment_id) ?? { shares: 0, costBasis: 0, currency: investment.currency ?? "CAD" };
      const shares = Number(transaction.shares) || 0;
      const price = Number(transaction.price) || 0;
      const commission = Number(transaction.commission) || 0;
      if (transaction.type === "buy") {
        ledger.shares += shares;
        ledger.costBasis += shares * price + commission;
      } else if (transaction.type === "sell") {
        const sold = Math.min(ledger.shares, shares);
        const soldCost = ledger.shares > 0 ? (ledger.costBasis / ledger.shares) * sold : 0;
        const rate = await rateFor(transaction.currency ?? ledger.currency);
        realizedGainValue += (sold * price - commission - soldCost) * rate;
        realizedCost += soldCost * rate;
        ledger.shares -= sold;
        ledger.costBasis -= soldCost;
      } else if (transaction.type === "split") {
        ledger.shares *= shares;
      } else if (transaction.type === "subdivision") {
        ledger.shares += shares;
      }
      ledgers.set(transaction.investment_id, ledger);
    }
    const realizedGainPercent = realizedCost > 0 ? (realizedGainValue / realizedCost) * 100 : 0;

    return NextResponse.json({
      todayGainValue: Math.round(todayGainValue * 100) / 100,
      todayGainPercent: Math.round(todayGainPercent * 100) / 100,
      unrealizedGainValue: Math.round(unrealizedGainValue * 100) / 100,
      unrealizedGainPercent: Math.round(unrealizedGainPercent * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
      netDeposits: Math.round(bookValue * 100) / 100,
      realizedGainValue: Math.round(realizedGainValue * 100) / 100,
      realizedGainPercent: Math.round(realizedGainPercent * 100) / 100,
    });
  } catch (err) {
    console.error("Portfolio gains error:", err);
    return NextResponse.json({
      todayGainValue: 0,
      todayGainPercent: 0,
      unrealizedGainValue: 0,
      unrealizedGainPercent: 0,
      bookValue: 0,
      netDeposits: 0,
      realizedGainValue: 0,
      realizedGainPercent: 0,
    });
  }
}
