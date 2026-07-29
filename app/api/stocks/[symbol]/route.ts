import { NextResponse } from "next/server";
import YahooFinance from "yahoo-finance2";
import { getHistoricalPrices, getTradingSessionBounds } from "@/lib/yahoo";

const yahooFinance = new YahooFinance({ suppressNotices: ["ripHistorical"] });

const intervals = new Set(["1D", "1W", "1M", "3M", "6M", "YTD", "1Y", "5Y", "10Y"]);

function getStartDate(interval: string, now: Date) {
  const start = new Date(now);
  switch (interval) {
    case "1W": start.setDate(start.getDate() - 7); break;
    case "1M": start.setMonth(start.getMonth() - 1); break;
    case "3M": start.setMonth(start.getMonth() - 3); break;
    case "6M": start.setMonth(start.getMonth() - 6); break;
    case "YTD": return new Date(now.getFullYear(), 0, 1);
    case "1Y": start.setFullYear(start.getFullYear() - 1); break;
    case "5Y": start.setFullYear(start.getFullYear() - 5); break;
    case "10Y": start.setFullYear(start.getFullYear() - 10); break;
    default: start.setMonth(start.getMonth() - 1);
  }
  return start;
}

export async function GET(request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = await params;
  const symbol = decodeURIComponent(rawSymbol).trim().toUpperCase();
  const intervalParam = new URL(request.url).searchParams.get("interval") ?? "1D";
  const interval = intervals.has(intervalParam) ? intervalParam : "1D";

  if (!symbol) return NextResponse.json({ error: "A symbol is required." }, { status: 400 });

  try {
    const now = new Date();
    const [quote, summary] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quoteSummary(symbol, {
        modules: ["assetProfile", "defaultKeyStatistics", "financialData", "price", "summaryDetail"],
      }).catch(() => null),
    ]);

    const intraday = interval === "1D";
    const bounds = intraday ? getTradingSessionBounds(now) : null;
    const history = await getHistoricalPrices(
      symbol,
      bounds?.start ?? getStartDate(interval, now),
      bounds?.end ?? now,
      intraday ? { intraday: true, interval: "5m" } : undefined
    );

    return NextResponse.json({
      symbol,
      interval,
      history,
      quote: {
        name: quote.longName ?? quote.shortName ?? summary?.price?.longName ?? symbol,
        price: quote.regularMarketPrice ?? 0,
        change: quote.regularMarketChange ?? 0,
        changePercent: quote.regularMarketChangePercent ?? 0,
        currency: quote.currency ?? summary?.price?.currency ?? "USD",
        marketState: quote.marketState ?? "CLOSED",
        exchange: quote.fullExchangeName ?? quote.exchange ?? summary?.price?.exchangeName ?? "—",
        open: quote.regularMarketOpen ?? 0,
        dayLow: quote.regularMarketDayLow ?? 0,
        dayHigh: quote.regularMarketDayHigh ?? 0,
        week52Low: quote.fiftyTwoWeekLow ?? 0,
        week52High: quote.fiftyTwoWeekHigh ?? 0,
        volume: quote.regularMarketVolume ?? 0,
        averageVolume: quote.averageDailyVolume3Month ?? 0,
        bid: quote.bid ?? 0,
        ask: quote.ask ?? 0,
        marketCap: quote.marketCap ?? summary?.summaryDetail?.marketCap ?? 0,
        sharesOutstanding: quote.sharesOutstanding ?? summary?.defaultKeyStatistics?.sharesOutstanding ?? 0,
        peRatio: quote.trailingPE ?? summary?.summaryDetail?.trailingPE ?? 0,
        description: summary?.assetProfile?.longBusinessSummary ?? "",
      },
    });
  } catch (error) {
    console.error(`Failed to fetch stock viewer data for ${symbol}:`, error);
    return NextResponse.json({ error: "Unable to load this stock right now." }, { status: 502 });
  }
}
