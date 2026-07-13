"use client";

import { useState, useMemo } from "react";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MortgageCalculatorPage() {
  const [homePrice, setHomePrice] = useState(300000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [termYears, setTermYears] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);
  const [propertyTax, setPropertyTax] = useState(2400);
  const [insurance, setInsurance] = useState(1200);

  const downPayment = (homePrice * downPaymentPercent) / 100;
  const loanAmount = homePrice - downPayment;
  const monthlyRate = interestRate / 100 / 12;
  const numPayments = termYears * 12;

  const monthlyPI = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const monthlyTax = propertyTax / 12;
  const monthlyInsurance = insurance / 12;
  const totalMonthly = monthlyPI + monthlyTax + monthlyInsurance;

  const amortizationSchedule = useMemo(() => {
    const schedule: { month: number; payment: number; principal: number; interest: number; balance: number }[] = [];
    let balance = loanAmount;
    for (let i = 1; i <= numPayments && i <= 360; i++) {
      const interest = balance * monthlyRate;
      const principal = monthlyPI - interest;
      balance -= principal;
      schedule.push({ month: i, payment: monthlyPI, principal, interest, balance: Math.max(balance, 0) });
    }
    return schedule;
  }, [loanAmount, monthlyRate, monthlyPI, numPayments]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Mortgage Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">Calculate your monthly mortgage payments</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Loan Details</h2>

          <div>
            <label className="text-sm font-medium text-foreground">Home Price ($)</label>
            <input type="number" value={homePrice} onChange={(e) => setHomePrice(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Down Payment (%)</label>
            <input type="number" value={downPaymentPercent} onChange={(e) => setDownPaymentPercent(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Loan Term (years)</label>
            <input type="number" value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Interest Rate (%)</label>
            <input type="number" step="0.1" value={interestRate} onChange={(e) => setInterestRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Property Tax ($/year)</label>
            <input type="number" value={propertyTax} onChange={(e) => setPropertyTax(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Home Insurance ($/year)</label>
            <input type="number" value={insurance} onChange={(e) => setInsurance(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold">Monthly Payment Breakdown</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(totalMonthly)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Principal & Interest</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(monthlyPI)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Property Tax</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(monthlyTax)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Insurance</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(monthlyInsurance)}</p>
              </div>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">Loan Amount</p>
                <p className="text-xl font-semibold text-foreground">{toCurrency(loanAmount)}</p>
              </div>
              <div className="rounded-xl bg-primary/10 p-4">
                <p className="text-sm text-muted-foreground">Down Payment</p>
                <p className="text-xl font-semibold text-foreground">{toCurrency(downPayment)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold">Amortization Schedule (First 12 Months)</h2>
            <div className="overflow-x-auto">
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
      </div>
    </div>
  );
}