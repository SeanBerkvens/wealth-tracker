import { getStockPrice } from "@/lib/yahoo";
import { normalizeCurrency } from "@/lib/currency-format";

export { DEFAULT_CURRENCY, formatCurrency, normalizeCurrency } from "@/lib/currency-format";

/** Returns the latest Yahoo Finance spot rate for one unit of `from`. */
export async function getExchangeRate(from: string, to: string) {
  const source = normalizeCurrency(from);
  const target = normalizeCurrency(to);
  if (source === target) return 1;

  try {
    return await getStockPrice(`${source}${target}=X`);
  } catch {
    const inverse = await getStockPrice(`${target}${source}=X`);
    if (!inverse) throw new Error(`No exchange rate available for ${source}/${target}`);
    return 1 / inverse;
  }
}

export async function getExchangeRates(fromCurrencies: Iterable<string>, to: string) {
  const sources = [...new Set([...fromCurrencies].map(normalizeCurrency))];
  const entries = await Promise.all(sources.map(async (source) => [source, await getExchangeRate(source, to)] as const));
  return new Map(entries);
}
