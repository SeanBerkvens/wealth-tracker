"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MortgagePayoffCalculatorPage() {
  const [balance, setBalance] = useState(200000);
  const [interestRate, setInterestRate] = useState(6.5);
  const [monthlyPayment, setMonthlyPayment] = useState(1800);
  const [extraPayment, setExtraPayment] = useState(200);

  const monthlyRate = interestRate / 100 / 12;

  const standardSchedule = useMemo(() => {
    const schedule: { month: number; balance: number }[] = [];
    let bal = balance;
    let month = 0;
    const payment = monthlyPayment;
    while (bal > 0 && month < 600) {
      month++;
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal <= 0) break;
      if (principal > bal) principal = bal;
      bal -= principal;
      schedule.push({ month, balance: Math.max(bal, 0) });
    }
    return { months: month, schedule };
  }, [balance, monthlyRate, monthlyPayment]);

  const acceleratedSchedule = useMemo(() => {
    const schedule: { month: number; balance: number }[] = [];
    let bal = balance;
    let month = 0;
    const payment = monthlyPayment + extraPayment;
    while (bal > 0 && month < 600) {
      month++;
      const interest = bal * monthlyRate;
      let principal = payment - interest;
      if (principal <= 0) break;
      if (principal > bal) principal = bal;
      bal -= principal;
      schedule.push({ month, balance: Math.max(bal, 0) });
    }
    return { months: month, schedule };
  }, [balance, monthlyRate, monthlyPayment, extraPayment]);

  const standardMonths = standardSchedule.months;
  const acceleratedMonths = acceleratedSchedule.months;
  const monthsSaved = standardMonths - acceleratedMonths;
  const yearsSaved = Math.floor(monthsSaved / 12);
  const remainingMonthsSaved = monthsSaved % 12;

  const standardTotal = monthlyPayment * standardMonths;
  const acceleratedTotal = (monthlyPayment + extraPayment) * acceleratedMonths;
  const interestSaved = (standardTotal - balance) - (acceleratedTotal - balance);

  const chartData = useMemo(() => {
    const maxMonths = Math.max(standardMonths, acceleratedMonths);
    const data: { year: number; Standard: number | null; Accelerated: number | null }[] = [];
    for (let m = 1; m <= maxMonths; m += 12) {
      const stdPoint = standardSchedule.schedule.find((s) => s.month === m);
      const accPoint = acceleratedSchedule.schedule.find((s) => s.month === m);
      data.push({
        year: Math.ceil(m / 12),
        Standard: stdPoint ? Math.round(stdPoint.balance) : null,
        Accelerated: accPoint ? Math.round(accPoint.balance) : null,
      });
    }
    return data;
  }, [standardSchedule, acceleratedSchedule, standardMonths, acceleratedMonths]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Mortgage Payoff Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">See how extra payments can accelerate your mortgage payoff</p>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold">Mortgage Details</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-foreground">Current Balance ($)</label>
            <input type="number" value={balance} onChange={(e) => setBalance(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
            <input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Current Monthly Payment ($)</label>
            <input type="number" value={monthlyPayment} onChange={(e) => setMonthlyPayment(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Extra Payment per Month ($)</label>
            <input type="number" value={extraPayment} onChange={(e) => setExtraPayment(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold">Comparison</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Standard Payoff Time</p>
            <p className="text-2xl font-semibold text-foreground">
              {Math.floor(standardMonths / 12)} yr {standardMonths % 12} mo
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Accelerated Payoff Time</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {Math.floor(acceleratedMonths / 12)} yr {acceleratedMonths % 12} mo
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Time Saved</p>
            <p className="text-2xl font-semibold text-foreground">
              {yearsSaved > 0 ? `${yearsSaved} yr ` : ""}{remainingMonthsSaved} mo
            </p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Interest Saved</p>
            <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{toCurrency(interestSaved)}</p>
          </div>
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">Standard Total Paid</p>
            <p className="text-xl font-semibold text-foreground">{toCurrency(standardTotal)}</p>
          </div>
          <div className="rounded-xl bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">Accelerated Total Paid</p>
            <p className="text-xl font-semibold text-foreground">{toCurrency(acceleratedTotal)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Balance Comparison</h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip
                formatter={(value: unknown) => [toCurrency(Number(value)), undefined]}
                labelFormatter={(label) => `Year ${label}`}
              />
              <Legend />
              <Line type="monotone" dataKey="Standard" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Accelerated" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}