"use client";

import { useState } from "react";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function toPercent(n: number) {
  return n.toFixed(2) + "%";
}

export default function InvestmentCalculatorPage() {
  const [startingAmount, setStartingAmount] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(20);
  const [compound, setCompound] = useState(12);

  const periodsPerYear = compound;
  const totalPeriods = years * periodsPerYear;
  const periodicRate = rate / 100 / periodsPerYear;

  const contributionPerPeriod = (monthlyContribution * 12) / periodsPerYear;
  const futureValue =
    startingAmount * Math.pow(1 + periodicRate, totalPeriods) +
    contributionPerPeriod * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);

  const totalContributions = startingAmount + monthlyContribution * 12 * years;
  const totalInterest = futureValue - totalContributions;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Investment Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">Calculate the future value of your investments</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Investment Details</h2>

          <div>
            <label className="text-sm font-medium text-foreground">Starting Amount ($)</label>
            <input
              type="number"
              value={startingAmount}
              onChange={(e) => setStartingAmount(Number(e.target.value))}
              className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Monthly Contribution ($)</label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(Number(e.target.value))}
              className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Annual Rate of Return (%)</label>
            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Number of Years</label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Compound Frequency</label>
            <select
              value={compound}
              onChange={(e) => setCompound(Number(e.target.value))}
              className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full"
            >
              <option value={1}>Annually</option>
              <option value={2}>Semi-Annually</option>
              <option value={4}>Quarterly</option>
              <option value={12}>Monthly</option>
              <option value={365}>Daily</option>
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Results</h2>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Future Value</p>
              <p className="text-2xl font-semibold text-foreground">{toCurrency(futureValue)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Contributions</p>
              <p className="text-2xl font-semibold text-foreground">{toCurrency(totalContributions)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Total Interest Earned</p>
              <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{toCurrency(totalInterest)}</p>
            </div>
            <div className="rounded-xl bg-muted p-4">
              <p className="text-sm text-muted-foreground">Annual Rate</p>
              <p className="text-2xl font-semibold text-foreground">{toPercent(rate)}</p>
            </div>
          </div>

          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">Investment Period</p>
            <p className="text-xl font-semibold text-foreground">{years} years</p>
          </div>
        </div>
      </div>
    </div>
  );
}