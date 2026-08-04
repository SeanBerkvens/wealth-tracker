type FinnhubSearchResult = { symbol?: string; description?: string };

// Shared by the manual holding picker and CSV imports so both paths use the
// same canonical company name for a ticker.
export async function getManualSearchCompanyName(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) return null;
  try {
    const response = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(symbol)}&token=${apiKey}`);
    if (!response.ok) return null;
    const data = await response.json() as { result?: FinnhubSearchResult[] };
    const normalized = symbol.trim().toUpperCase();
    const match = data.result?.find((item) => item.symbol?.trim().toUpperCase() === normalized);
    return match?.description?.trim() || null;
  } catch {
    return null;
  }
}
