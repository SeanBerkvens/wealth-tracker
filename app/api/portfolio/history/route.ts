import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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

    // Fetch all investments
    const { data: investments } = await supabase
      .from("investments")
      .select("*");

    if (!investments || investments.length === 0) {
      return NextResponse.json([]);
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

    // Build a map of date -> total portfolio value
    const dateValueMap: Record<string, number> = {};

    for (const investment of investments) {
      const prices = symbolHistoryMap[investment.symbol];
      if (!prices || prices.length === 0) continue;

      const shares = Number(investment.shares);

      for (const pricePoint of prices) {
        const value = shares * pricePoint.close;
        dateValueMap[pricePoint.date] =
          (dateValueMap[pricePoint.date] || 0) + value;
      }
    }

    // Fetch all transactions to build cumulative book value
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .order("date", { ascending: true });

    // Build cumulative book value map by date
    const dateBookValueMap: Record<string, number> = {};
    let runningBookValue = 0;

    if (transactions && transactions.length > 0) {
      // Group transactions by date
      const txByDate: Record<string, { shares: number; price: number; type: string }[]> = {};
      for (const tx of transactions) {
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
