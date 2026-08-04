/** Browser-safe currency utilities. Keep Yahoo Finance imports out of this file. */
export const DEFAULT_CURRENCY = "CAD";

export function normalizeCurrency(value: string | null | undefined) {
  return /^[A-Za-z]{3}$/.test(value ?? "") ? value!.toUpperCase() : DEFAULT_CURRENCY;
}

export function formatCurrency(value: number, currency = DEFAULT_CURRENCY) {
  void currency;
  return `$${new Intl.NumberFormat(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 }).format(Number(value) || 0)}`;
}
