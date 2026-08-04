import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["ripHistorical"],
});

export interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  name?: string;
}

export interface StockQuoteDetails {
  price: number;
  change: number;
  changePercent: number;
  dayLow: number;
  dayHigh: number;
  week52Low: number;
  week52High: number;
  sparkline: number[];
  sparklinePreviousTradingDay: boolean;
  positive: boolean;
  currency: string;
}

export async function getStockPrice(symbol: string) {
  const quote = await yahooFinance.quote(symbol);

  if (!quote.regularMarketPrice) {
    throw new Error("No price returned for symbol");
  }

  return quote.regularMarketPrice;
}

export async function getStockQuote(symbol: string): Promise<StockQuote> {
  const quote = await yahooFinance.quote(symbol);

  return {
    price: quote.regularMarketPrice ?? 0,
    change: quote.regularMarketChange ?? 0,
    changePercent: quote.regularMarketChangePercent ?? 0,
    currency: quote.currency ?? "USD",
    name: quote.longName ?? quote.shortName ?? undefined,
  };
}

export async function getStockQuoteDetails(symbol: string): Promise<StockQuoteDetails> {
  const quote = await yahooFinance.quote(symbol);

  const price = quote.regularMarketPrice ?? 0;
  const change = quote.regularMarketChange ?? 0;
  const changePercent = quote.regularMarketChangePercent ?? 0;

  // Fetch intraday sparkline data
  let sparkline: number[] = [];
  let sparklinePreviousTradingDay = false;
  try {
    const now = new Date();
    const { start, end } = getTradingSessionBounds(now);
    const history = await getHistoricalPrices(symbol, start, end, {
      intraday: true,
      interval: "5m",
    });
    sparkline = history.map((h) => h.close);
    // On market holidays Yahoo has no intraday points. Walk back through the
    // recent calendar until we find the latest completed trading session.
    if (sparkline.length < 2) {
      for (let daysBack = 1; daysBack <= 7; daysBack += 1) {
        const prior = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
        const bounds = getTradingSessionBounds(prior);
        const previousHistory = await getHistoricalPrices(symbol, bounds.start, bounds.end, {
          intraday: true,
          interval: "5m",
        });
        if (previousHistory.length >= 2) {
          sparkline = previousHistory.map((h) => h.close);
          sparklinePreviousTradingDay = true;
          break;
        }
      }
    }
  } catch {
    // Sparkline data is optional
  }

  return {
    price,
    change,
    changePercent,
    dayLow: quote.regularMarketDayLow ?? 0,
    dayHigh: quote.regularMarketDayHigh ?? 0,
    week52Low: quote.fiftyTwoWeekLow ?? 0,
    week52High: quote.fiftyTwoWeekHigh ?? 0,
    sparkline,
    sparklinePreviousTradingDay,
    positive: change >= 0,
    currency: quote.currency ?? "USD",
  };
}

/**
 * Returns the UTC offset (in ms) of the America/New_York timezone at the given
 * instant. Positive means ET is behind UTC.
 */
function getEtOffsetMs(utcDate: Date): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(utcDate);
  const [datePart, timePart] = s.split(", ");
  const [mm, dd, yy] = datePart.split("/");
  const [hh, mi, ss] = timePart.split(":");
  const yyN = parseInt(yy, 10);
  const mmN = parseInt(mm, 10);
  const ddN = parseInt(dd, 10);
  const hhN = parseInt(hh, 10);
  const miN = parseInt(mi, 10);
  const ssN = parseInt(ss, 10);
  const asUtc = Date.UTC(yyN, mmN - 1, ddN, hhN, miN, ssN);
  return asUtc - utcDate.getTime();
}

/**
 * Builds a UTC Date that corresponds to a wall-clock time in America/New_York.
 */
function etDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getEtOffsetMs(guess);
  return new Date(guess.getTime() - offset);
}

export interface IntradayOptions {
  intraday?: boolean;
  interval?: string;
}

export async function getHistoricalPrices(
  symbol: string,
  startDate: Date,
  endDate: Date,
  options?: IntradayOptions
) {
  if (options?.intraday) {
    type ChartQuote = { date: Date; close: number | null };
    type ChartResult = { quotes: ChartQuote[] };

    const result = (await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: (options.interval ?? "1h") as "1d",
      includePrePost: false,
      return: "array",
    })) as ChartResult;

    const quotes = Array.isArray(result?.quotes) ? result.quotes : [];

    return quotes
      .filter((q): q is ChartQuote => q != null && q.close != null)
      .map((q) => ({
        date: new Date(q.date).toISOString(),
        close: q.close!,
      }));
  }

  const result = await yahooFinance.historical(symbol, {
    period1: startDate,
    period2: endDate,
    interval: "1d" as const,
  });

  return result.map(
    (entry: { date: Date; close: number | null }) => ({
      date: entry.date.toISOString().split("T")[0],
      close: entry.close ?? 0,
    })
  );
}

/**
 * Computes the start (9:00 AM ET) and end (4:30 PM ET, or "now" if the session
 * is still in progress) for the most recent trading session relative to `now`.
 * Weekends are skipped; if `now` is before the open, the previous trading day
 * is used so the chart is always populated.
 */
export function getTradingSessionBounds(now: Date): {
  start: Date;
  end: Date;
} {
  const etParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) =>
    etParts.find((p) => p.type === type)?.value ?? "";

  const weekday = get("weekday");
  const year = parseInt(get("year"), 10);
  const month = parseInt(get("month"), 10);
  const day = parseInt(get("day"), 10);
  const hour = parseInt(get("hour"), 10);
  const minute = parseInt(get("minute"), 10);
  const minutesOfDay = hour * 60 + minute;

  const isWeekend = weekday === "Sat" || weekday === "Sun";
  const sessionStart = 9 * 60; // 9:00 AM
  const sessionEnd = 16 * 60 + 30; // 4:30 PM

  // Decide which trading day to display.
  let displayYear = year;
  let displayMonth = month;
  let displayDay = day;

  const shiftDay = (dy: number, dm: number, dd: number, delta: number) => {
    const d = new Date(Date.UTC(dy, dm - 1, dd + delta, 12, 0, 0));
    return {
      y: d.getUTCFullYear(),
      m: d.getUTCMonth() + 1,
      d: d.getUTCDate(),
    };
  };

  const weekdayOf = (dy: number, dm: number, dd: number) => {
    const d = new Date(Date.UTC(dy, dm - 1, dd, 12, 0, 0));
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  };

  if (isWeekend) {
    // Step back to Friday.
    const delta = weekday === "Sat" ? -1 : -2;
    const r = shiftDay(year, month, day, delta);
    displayYear = r.y;
    displayMonth = r.m;
    displayDay = r.d;
  } else if (minutesOfDay < sessionStart) {
    // Before the open today → show previous trading day.
    let delta = -1;
    let r = shiftDay(year, month, day, delta);
    while (
      weekdayOf(r.y, r.m, r.d) === "Sat" ||
      weekdayOf(r.y, r.m, r.d) === "Sun"
    ) {
      delta -= 1;
      r = shiftDay(year, month, day, delta);
    }
    displayYear = r.y;
    displayMonth = r.m;
    displayDay = r.d;
  }

  const start = etDate(displayYear, displayMonth, displayDay, 9, 0);
  let end = etDate(displayYear, displayMonth, displayDay, 16, 30);

  // If we're displaying today and the session hasn't ended yet, cap at now.
  if (
    displayYear === year &&
    displayMonth === month &&
    displayDay === day &&
    minutesOfDay < sessionEnd
  ) {
    end = new Date(Math.min(end.getTime(), now.getTime()));
  }

  return { start, end };
}

export type ListingResolution = {
  symbol: string;
  resolvedSymbol: string;
  currency: string;
  price: number;
  confirmed: boolean;
};

/**
 * Broker exports often omit the exchange suffix. For CAD trades, prefer a
 * verified TSX listing rather than accidentally accepting a U.S. ticker with
 * the same letters (for example ZSP.TO instead of ZSP).
 */
export async function resolveListingSymbol(symbol: string, declaredCurrency?: string): Promise<ListingResolution> {
  const normalized = symbol.trim().toUpperCase();
  const currency = (declaredCurrency ?? "").trim().toUpperCase();
  const candidates = currency === "CAD" && !normalized.includes(".")
    ? [`${normalized}.TO`, normalized]
    : [normalized];

  const results = await Promise.all(candidates.map(async (candidate) => {
    try {
      const quote = await getStockQuote(candidate);
      return { candidate, quote };
    } catch {
      return null;
    }
  }));
  const matching = results.find((result) => result && result.quote.price > 0 && result.quote.currency.toUpperCase() === currency);
  if (matching) return { symbol: normalized, resolvedSymbol: matching.candidate, currency: matching.quote.currency, price: matching.quote.price, confirmed: true };

  const available = results.find((result) => result && result.quote.price > 0);
  return {
    symbol: normalized,
    resolvedSymbol: available?.candidate ?? normalized,
    currency: available?.quote.currency ?? "",
    price: available?.quote.price ?? 0,
    // An explicit exchange suffix (such as .TO) is already a specific listing,
    // even when a corporate-action row has no currency column.
    confirmed: !currency && normalized.includes(".") && !!available,
  };
}
