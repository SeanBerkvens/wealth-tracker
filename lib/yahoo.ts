import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["ripHistorical"],
});

export async function getStockPrice(symbol: string) {
  const quote = await yahooFinance.quote(symbol);

  if (!quote.regularMarketPrice) {
    throw new Error("No price returned for symbol");
  }

  return quote.regularMarketPrice;
}

export async function getHistoricalPrices(
  symbol: string,
  startDate: Date,
  endDate: Date
) {
  const result = await yahooFinance.historical(symbol, {
    period1: startDate,
    period2: endDate,
    interval: "1d" as const,
  });

  return result.map((entry: { date: Date; close: number | null }) => ({
    date: entry.date.toISOString().split("T")[0],
    close: entry.close ?? 0,
  }));
}