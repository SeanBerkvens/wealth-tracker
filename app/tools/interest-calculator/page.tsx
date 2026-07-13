"use client";

import { useState } from "react";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InterestCalculatorPage() {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(5);
  const [time, setTime] = useState(3);
  const [interestType, setInterestType] = useState<"simple" | "compound">("simple");
  const [compound, setCompound] = useState(12);

  let interest = 0;
  let finalAmount = 0;

  if (interestType === "simple") {
    // Simple Interest: I = P * r * t
    interest = principal * (rate / 100) * time;
    finalAmount = principal + interest;
  } else {
    // Compound Interest: A = P(1 + r/n)^(nt)
    const periods = compound * time;
    const periodicRate = rate / 100 / compound;
    finalAmount = principal * Math.pow(1 + periodicRate, periods);
    interest = finalAmount - principal;
  }

  const dailyRate = rate / 100 / 365;
  const monthlyRate = rate / 100 / 12;
  const dailyInterest = principal * dailyRate;
  const monthlyInterest = principal * monthlyRate;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Interest Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">Calculate simple or compound interest on your principal</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Interest Details</h2>

          <div>
            <label className="text-sm font-medium text-foreground">Principal Amount ($)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Time Period (years)</label>
            <input type="number" step="0.1" value={time} onChange={(e) => setTime(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Interest Type</label>
            <select value={interestType} onChange={(e) => setInterestType(e.target.value as "simple" | "compound")} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full">
              <option value="simple">Simple Interest</option>
              <option value="compound">Compound Interest</option>
            </select>
          </div>

          {interestType === "compound" && (
            <div>
              <label className="text-sm font-medium text-foreground">Compound Frequency</label>
              <select value={compound} onChange={(e) => setCompound(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full">
                <option value={1}>Annually</option>
                <option value={2}>Semi-Annually</option>
                <option value={4}>Quarterly</option>
                <option value={12}>Monthly</option>
                <option value={365}>Daily</option>
              </select>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold">Results</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Final Amount</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(finalAmount)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className={`text-2xl font-semibold ${interest >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {toCurrency(interest)}
                </p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Principal</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(principal)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">{interestType === "simple" ? "Simple" : "Compound"} Interest</p>
                <p className="text-2xl font-semibold text-foreground">{interestType === "simple" ? "Simple" : `${compound}x / year`}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Interest Breakdown</h2>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Daily Interest</p>
                <p className="text-lg font-semibold text-foreground">{toCurrency(dailyInterest)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Monthly Interest</p>
                <p className="text-lg font-semibold text-foreground">{toCurrency(monthlyInterest)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="text-xs text-muted-foreground">Annual Interest</p>
                <p className="text-lg font-semibold text-foreground">{toCurrency(principal * (rate / 100))}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}