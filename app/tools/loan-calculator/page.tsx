"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(25000);
  const [termYears, setTermYears] = useState(5);
  const [interestRate, setInterestRate] = useState(6.5);

  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyPayment = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const totalPayment = monthlyPayment * numPayments;
  const totalInterest = totalPayment - loanAmount;

  const amortizationSchedule = useMemo(() => {
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = loanAmount;
    for (let i = 1; i <= numPayments; i++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPayment - interest;
      balance -= principal;
      schedule.push({ month: i, payment: monthlyPayment, principal, interest, balance: Math.max(balance, 0) });
    }
    return schedule;
  }, [loanAmount, monthlyRate, monthlyPayment, numPayments]);

  const yearlyChartData = useMemo(() => {
    return amortizationSchedule
      .filter((row) => row.month % 12 === 0)
      .map((row) => ({
        year: Math.floor(row.month / 12),
        balance: Math.round(row.balance),
      }));
  }, [amortizationSchedule]);

  const pieData = [
    { name: "Principal", value: loanAmount },
    { name: "Interest", value: totalInterest },
  ];
  const PIE_COLORS = ["var(--chart-1)", "var(--chart-3)"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Loan Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">Calculate your loan payments and amortization schedule</p>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold">Loan Details</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          <div>
            <label className="text-sm font-medium text-foreground">Loan Amount ($)</label>
            <input type="number" value={loanAmount} onChange={(e) => setLoanAmount(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Loan Term (years)</label>
            <input type="number" value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
            <input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
        <h2 className="text-lg font-semibold">Payment Summary</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Monthly Payment</p>
            <p className="text-2xl font-semibold text-foreground">{toCurrency(monthlyPayment)}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Total Payment</p>
            <p className="text-2xl font-semibold text-foreground">{toCurrency(totalPayment)}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Total Interest</p>
            <p className="text-2xl font-semibold text-rose-600 dark:text-rose-400">{toCurrency(totalInterest)}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-sm text-muted-foreground">Number of Payments</p>
            <p className="text-2xl font-semibold text-foreground">{numPayments}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Balance Over Time</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyChartData}>
                <defs>
                  <linearGradient id="loanBalanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis hide />
                <Tooltip
                  formatter={(value: unknown) => [toCurrency(Number(value)), undefined]}
                  labelFormatter={(label) => `Year ${label}`}
                />
                <Area type="monotone" dataKey="balance" stroke="var(--chart-1)" strokeWidth={2} fill="url(#loanBalanceGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Total Cost Breakdown</h2>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {pieData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: unknown) => [toCurrency(Number(value)), undefined]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-sm">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-medium">{toCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold">Amortization Schedule (First 12 Months)</h2>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="text-sm w-full">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-2 text-left">Month</th>
                <th className="py-2 text-right">Payment</th>
                <th className="py-2 text-right">Principal</th>
                <th className="py-2 text-right">Interest</th>
                <th className="py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {amortizationSchedule.slice(0, 12).map((row) => (
                <tr key={row.month} className="border-b border-border last:border-none">
                  <td className="py-2 text-left">{row.month}</td>
                  <td className="py-2 text-right">{toCurrency(row.payment)}</td>
                  <td className="py-2 text-right">{toCurrency(row.principal)}</td>
                  <td className="py-2 text-right">{toCurrency(row.interest)}</td>
                  <td className="py-2 text-right">{toCurrency(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}