"use client";

import { useState } from "react";

function toCurrency(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function RetirementCalculatorPage() {
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [rate, setRate] = useState(7);
  const [currentIncome, setCurrentIncome] = useState(75000);
  const [desiredIncomePercent, setDesiredIncomePercent] = useState(80);
  const [withdrawalRate, setWithdrawalRate] = useState(4);

  const yearsToRetirement = retirementAge - currentAge;
  const monthlyRate = rate / 100 / 12;
  const totalMonths = yearsToRetirement * 12;

  // Future value of savings at retirement
  const savingsAtRetirement =
    currentSavings * Math.pow(1 + monthlyRate, totalMonths) +
    monthlyContribution * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate);

  const desiredAnnualIncome = currentIncome * (desiredIncomePercent / 100);
  const withdrawalNeeded = desiredAnnualIncome;
  const requiredSavings = withdrawalNeeded / (withdrawalRate / 100);

  const gap = savingsAtRetirement - requiredSavings;
  const isOnTrack = gap >= 0;

  // Calculate what monthly contribution would be needed to reach goal
  let neededContribution = monthlyContribution;
  if (savingsAtRetirement < requiredSavings) {
    // FV = PV(1+r)^n + PMT * [((1+r)^n - 1)/r]
    // PMT = (FV - PV(1+r)^n) / [((1+r)^n - 1)/r]
    const fvFactor = (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
    neededContribution = (requiredSavings - currentSavings * Math.pow(1 + monthlyRate, totalMonths)) / fvFactor;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">Retirement Calculator</h1>
        <p className="mt-1 text-muted-foreground text-lg">Plan your retirement savings and income</p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold">Your Details</h2>

          <div>
            <label className="text-sm font-medium text-foreground">Current Age</label>
            <input type="number" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Retirement Age</label>
            <input type="number" value={retirementAge} onChange={(e) => setRetirementAge(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Current Savings ($)</label>
            <input type="number" value={currentSavings} onChange={(e) => setCurrentSavings(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Monthly Contribution ($)</label>
            <input type="number" value={monthlyContribution} onChange={(e) => setMonthlyContribution(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Annual Rate of Return (%)</label>
            <input type="number" step="0.1" value={rate} onChange={(e) => setRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Current Annual Income ($)</label>
            <input type="number" value={currentIncome} onChange={(e) => setCurrentIncome(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Desired Income (% of current)</label>
            <input type="number" value={desiredIncomePercent} onChange={(e) => setDesiredIncomePercent(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">Withdrawal Rate (%)</label>
            <input type="number" step="0.1" value={withdrawalRate} onChange={(e) => setWithdrawalRate(Number(e.target.value))} className="mt-1 px-3 py-2 rounded-md border border-border bg-background text-foreground w-full" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-card border border-border shadow-sm p-6 space-y-5">
            <h2 className="text-lg font-semibold">Retirement Projection</h2>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Savings at Retirement</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(savingsAtRetirement)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Required Savings</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(requiredSavings)}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Est. Annual Retirement Income</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(savingsAtRetirement * (withdrawalRate / 100))}</p>
              </div>
              <div className="rounded-xl bg-muted p-4">
                <p className="text-sm text-muted-foreground">Desired Annual Income</p>
                <p className="text-2xl font-semibold text-foreground">{toCurrency(desiredAnnualIncome)}</p>
              </div>
            </div>

            <div className={`rounded-xl p-4 ${isOnTrack ? "bg-emerald-50 dark:bg-emerald-950" : "bg-rose-50 dark:bg-rose-950"}`}>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={`text-xl font-semibold ${isOnTrack ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                {isOnTrack ? "On Track 🎉" : "Gap Detected"}
              </p>
              {!isOnTrack && (
                <p className="text-sm text-muted-foreground mt-2">
                  You are short by {toCurrency(Math.abs(gap))}. You need to contribute approximately{" "}
                  <span className="font-semibold text-foreground">{toCurrency(neededContribution)}</span> per month to reach your goal.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">Years Until Retirement</p>
              <p className="text-xl font-semibold text-foreground">{yearsToRetirement} years</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}