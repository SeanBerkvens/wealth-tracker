import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getHistoricalPrices, getTradingSessionBounds } from "@/lib/yahoo";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const interval = searchParams.get("interval") || "1M";

    // Calculate date range based on interval
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let isIntraday = false;

    switch (interval) {
      case "1D": {
        const bounds = getTradingSessionBounds(now);
        startDate = bounds.start;
        endDate = bounds.end;
        isIntraday = true;
        break;
      }
      case "1W":
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "1M":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "3M":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "6M":
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 6);
        break;
      case "1Y":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "5Y":
        startDate = new Date(now);
        startDate.setFullYear(startDate.getFullYear() - 5);
        break;
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
    }

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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Fetch all investments (optionally filtered by portfolio)
    let investmentsQuery = supabase.from("investments").select("*").eq("user_id", userId);
    if (portfolio) {
      investmentsQuery = investmentsQuery.eq("portfolio", portfolio);
    }
    const { data: investments } = await investmentsQuery;

    if (!investments || investments.length === 0) {
      return NextResponse.json([]);
    }

    // For "ALL" interval, find earliest purchase date or transaction date
    if (interval === "ALL") {
      const { data: firstTx } = await supabase
        .from("transactions")
        .select("date")
        .eq("user_id", userId)
        .order("date", { ascending: true })
        .limit(1);

      if (firstTx && firstTx.length > 0) {
        startDate = new Date(firstTx[0].date);
      } else {
        // Fall back to earliest purchase_date from investments
        const earliest = investments.reduce((earliest, inv) => {
          if (inv.purchase_date && inv.purchase_date < earliest) {
            return inv.purchase_date;
          }
          return earliest;
        }, "9999-12-31");
        startDate = new Date(earliest);
      }
    }

    // Clamp startDate to not go before the earliest transaction date
    // to avoid showing empty pre-holding periods
    const { data: earliestTx } = await supabase
      .from("transactions")
      .select("date")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .limit(1);

    if (earliestTx && earliestTx.length > 0) {
      const earliestDate = new Date(earliestTx[0].date);
      if (startDate < earliestDate) {
        startDate = earliestDate;
      }
    }

    // Fetch historical prices for each symbol
    const symbolHistoryMap: Record<string, { date: string; close: number }[]> =
      {};

    for (const investment of investments) {
      try {
        const prices = await getHistoricalPrices(
          investment.symbol,
          startDate,
          endDate,
          { intraday: isIntraday }
        );
        symbolHistoryMap[investment.symbol] = prices;
      } catch (err) {
        console.error(`Failed to fetch history for ${investment.symbol}:`, err);
        symbolHistoryMap[investment.symbol] = [];
      }
    }

    // Forward-fill missing price data for each stock and calculate portfolio value
    // Collect all unique dates sorted
    const allDatesSet = new Set<string>();
    for (const investment of investments) {
      const prices = symbolHistoryMap[investment.symbol];
      if (!prices || prices.length === 0) continue;
      for (const pricePoint of prices) {
        allDatesSet.add(pricePoint.date);
      }
    }
    const allDates = Array.from(allDatesSet).sort();

    // For each stock, create a complete price series by forward-filling missing days
    const filledPriceMap: Record<string, Map<string, number>> = {};

    for (const investment of investments) {
      const prices = symbolHistoryMap[investment.symbol];
      if (!prices || prices.length === 0) continue;

      // Build a map of date -> close price for this symbol
      const priceMap = new Map<string, number>();
      for (const p of prices) {
        if (p.close != null) {
          priceMap.set(p.date, p.close);
        }
      }

      // Create a new map with forward-filled prices for all dates
      const filledMap = new Map<string, number>();
      let lastKnownPrice: number | undefined;

      for (const date of allDates) {
        if (priceMap.has(date)) {
          lastKnownPrice = priceMap.get(date);
        }
        if (lastKnownPrice !== undefined) {
          filledMap.set(date, lastKnownPrice);
        }
      }

      filledPriceMap[investment.symbol] = filledMap;
    }

    // Build a map of date -> total portfolio value using forward-filled prices
    const dateValueMap: Record<string, number> = {};

    for (const date of allDates) {
      let totalValue = 0;
      
      for (const investment of investments) {
        const filledMap = filledPriceMap[investment.symbol];
        if (!filledMap) continue;

        const shares = Number(investment.shares);
        const price = filledMap.get(date);
        
        if (price !== undefined) {
          totalValue += shares * price;
        }
      }
      
      dateValueMap[date] = totalValue;
    }

    // Get the set of currently held symbols
    const heldSymbols = new Set(investments.map((inv) => inv.symbol));

    // Fetch all transactions to build cumulative book value (optionally filtered by portfolio)
    let txQuery = supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: true });
    if (portfolio) {
      txQuery = txQuery.eq("portfolio", portfolio);
    }
    const { data: transactions } = await txQuery;

    // Build cumulative book value map by date
    const dateBookValueMap: Record<string, number> = {};
    let runningBookValue = 0;

    if (transactions && transactions.length > 0) {
      // Group transactions by date, only for symbols that are still held
      const txByDate: Record<string, { shares: number; price: number; type: string }[]> = {};
      for (const tx of transactions) {
        // Skip transactions for symbols that are no longer held
        if (!heldSymbols.has(tx.symbol)) continue;

        const txDate = tx.date; // YYYY-MM-DD format
        if (!txByDate[txDate]) txByDate[txDate] = [];
        txByDate[txDate].push({
          shares: Number(tx.shares),
          price: Number(tx.price),
          type: tx.type,
        });
      }

      const sortedTxDates = Object.keys(txByDate).sort();

      // Pre-compute book value at each transaction date
      for (const txDate of sortedTxDates) {
        const txs = txByDate[txDate];
        for (const tx of txs) {
          if (tx.type === "buy") {
            runningBookValue += tx.shares * tx.price;
          } else {
            runningBookValue -= tx.shares * tx.price;
          }
        }
        dateBookValueMap[txDate] = runningBookValue;
      }
    }

    // Convert to sorted array, merging book value
    const history = Object.entries(dateValueMap)
      .map(([date, value]) => {
        // Find the book value at or before this date
        const txDates = Object.keys(dateBookValueMap).sort();
        let bookValue = 0;
        for (const txDate of txDates) {
          if (txDate <= date) {
            bookValue = dateBookValueMap[txDate];
          } else {
            break;
          }
        }
        return { date, value: Math.round(value), bookValue: Math.round(bookValue) };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(history);
  } catch (err) {
    console.error("Portfolio history error:", err);
    return NextResponse.json([]);
  }
}
