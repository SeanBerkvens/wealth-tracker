"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { normalizeCurrency } from "@/lib/currency-format";
import { createClient } from "@/lib/supabase/client";

const priorityCurrencies = ["CAD", "USD", "EUR"];
const allCurrencies = Intl.supportedValuesOf("currency").filter((currency) => !priorityCurrencies.includes(currency));
const currencyFlags: Record<string, string> = {
  CAD: "🇨🇦", USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CNY: "🇨🇳",
  AUD: "🇦🇺", NZD: "🇳🇿", CHF: "🇨🇭", INR: "🇮🇳", KRW: "🇰🇷", MXN: "🇲🇽",
  BRL: "🇧🇷", HKD: "🇭🇰", SGD: "🇸🇬", SEK: "🇸🇪", NOK: "🇳🇴", DKK: "🇩🇰",
  PLN: "🇵🇱", TRY: "🇹🇷", ZAR: "🇿🇦", AED: "🇦🇪", SAR: "🇸🇦", THB: "🇹🇭",
};

function flagForCurrency(currency: string) {
  return currencyFlags[currency] ?? "💱";
}

export function CurrencySelect() {
  const { user } = useAuth();
  const router = useRouter();
  const initial = normalizeCurrency(user?.user_metadata?.preferred_currency);
  const [currency, setCurrency] = useState(initial);
  const [saving, setSaving] = useState(false);
  const currencies = useMemo(() => [...priorityCurrencies, ...allCurrencies], []);

  async function changeCurrency(next: string) {
    setCurrency(next);
    if (!user) return;
    setSaving(true);
    const { error } = await createClient().auth.updateUser({
      data: { ...user.user_metadata, preferred_currency: next },
    });
    if (!error) {
      await createClient().from("profiles").upsert({ id: user.id, preferred_currency: next });
    }
    setSaving(false);
    if (!error) router.refresh();
  }

  return <label className="sidebar-link flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-foreground transition-all duration-200 hover:bg-sidebar-accent">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none" aria-hidden="true">{flagForCurrency(currency)}</span>
    <span className="flex-1 text-sm font-medium">Currency</span>
    <select aria-label="Reporting currency" value={currency} disabled={saving} onChange={(event) => void changeCurrency(event.target.value)} className="w-[76px] cursor-pointer appearance-none rounded-lg border border-sidebar-border bg-sidebar-accent px-2 py-1 text-center text-xs font-semibold text-sidebar-foreground outline-none transition hover:border-primary focus:border-primary disabled:opacity-60">
      {currencies.map((code) => <option key={code} value={code}>{flagForCurrency(code)} {code}</option>)}
    </select>
  </label>;
}
