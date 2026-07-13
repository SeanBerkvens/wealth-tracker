"use client";

import { useState } from "react";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function CompoundInterestCalculatorPage() {
  const [principal, setPrincipal] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [rate, setRate] = useState(7);
  const [compound, setCompound] = useState(12);
  const [years, setYears] = useState(20);

  const periodsPerYear = compound;
  const totalPeriods = years * periodsPerYear;
  const periodicRate = rate / 100 / periodsPerYear;
  const contributionPerPeriod = (monthlyContribution * 12) / periodsPerYear;

  const futureValue =
    principal * Math.pow(1 + periodicRate, totalPeriods) +
    contributionPerPeriod * ((Math.pow(1 + periodicRate, totalPeriods) - 1) / periodicRate);

  const totalContributions = principal + monthlyContribution * 12 * years;
  const totalInterest = futureValue - totalContributions;

  // Year-by-year breakdown
  const yearlyData: { year: number; balance: number; contribution: number; interest: number }[] = [];
  let runningBalance = principal;
  for (let y = 1; y <= years; y++) {
    const yearlyContribution = monthlyContribution * 12;
    let yearStart = runningBalance;
    for (let p = 0; p < periodsPerYear; p++) {
      const deposit = contributionPerPeriod;
      const interestOnStart = (yearStart + deposit) * periodicRate;
      yearStart = (yearStart + deposit) * (1 + periodicRate);
    }
    runningBalance = yearStart;
    const totalAdded = principal + yearlyContribution * y;
    yearlyData.push({
      year: y,
      balance: runningBalance,
      contribution: totalAdded,
      interest: runningBalance - totalAdded,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Compound Interest Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">See how your money grows with compound interest</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Investment Details</h2>

          <div>
            <label className="text-sm font-medium text-foreground">Principal Amount ($)</label>
            <input type="number" value={principal} onChange={(e) => setPrincipal(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Monthly Contribution ($)</label>
            <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Annual Interest Rate (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
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
          <div>
            <label className="text-sm font-medium text-foreground">Number of Years</label>
            <input type="number" value={years} onChange={(e) => setYears(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
        </div>

        <div className="space-y-6">
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
                <p className="text-sm text-muted-foreground">Total Interest</p>
                <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{toCurrency(totalInterest)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Periods per Year</p>
                <p className="text-2xl font-semibold text-foreground">{compound}x</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Year-by-Year Breakdown</h2>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="text-sm w-full">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-2 text-left">Year</th>
                    <th className="py-2 text-right">Balance</th>
                    <th className="py-2 text-right">Contributions</th>
                    <th className="py-2 text-right">Interest</th>
                  </tr>
                </thead>
                <tbody>
                  {yearlyData.map((row) => (
                    <tr key={row.year} className="border-b border-border last:border-none">
                      <td className="py-2 text-left">{row.year}</td>
                      <td className="py-2 text-right font-medium">{toCurrency(row.balance)}</td>
                      <td className="py-2 text-right">{toCurrency(row.contribution)}</td>
                      <td className="py-2 text-right text-emerald-600 dark:text-emerald-400">{toCurrency(row.interest)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}