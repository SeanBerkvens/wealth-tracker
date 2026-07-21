"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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

  const chartData = yearlyData.map((row) => ({
    year: row.year,
    Contributions: Math.round(row.contribution),
    Interest: Math.round(row.interest),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Compound Interest Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">See how your money grows with compound interest</p>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold">Investment Details</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
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
            <p className="text-sm text-muted-foreground">Total Interest</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{toCurrency(totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Periods per Year</p>
            <p className="text-2xl font-semibold text-foreground">{compound}x</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-card border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Growth Over Time</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="interestGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                formatter={(value: unknown) => [toCurrency(Number(value)), undefined]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Area type="monotone" dataKey="Contributions" stackId="1" stroke="var(--chart-1)" strokeWidth={2} fill="url(#contribGrad)" />
              <Area type="monotone" dataKey="Interest" stackId="1" stroke="var(--chart-2)" strokeWidth={2} fill="url(#interestGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "var(--chart-1)" }} />
            <span className="text-muted-foreground">Contributions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: "var(--chart-2)" }} />
            <span className="text-muted-foreground">Interest Earned</span>
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
  );
}