import Link from "next/link";
import { redirect } from "next/navigation";
import WealthCard from "@/components/dashboard/wealth-card";
import { AssetAllocation } from "@/components/dashboard/asset-allocation";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import PortfolioPerformance from "@/components/dashboard/portfolio-performance";
import TopHoldings from "@/components/dashboard/top-holdings";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, getExchangeRates, normalizeCurrency } from "@/lib/currency";
import { EmptyState } from "@/components/ui/empty-state";
import AddAccountForm from "@/components/accounts/add-account-form";
import AddAssetForm from "@/components/assets/add-asset-form";
import AddLiabilityForm from "@/components/liabilities/add-liability-form";
import AddPortfolioForm from "@/components/investments/add-portfolio-form";
import { LayoutDashboard } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const userId = user.id;

  const [
    { data: accounts },
    { data: assets },
    { data: liabilities },
    { data: investments },
    { data: portfolios },
    { data: transactions },
  ] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("assets").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("liabilities").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("investments").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("portfolios").select("id, name, is_ignored").eq("user_id", userId).order("name", { ascending: true }),
    supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(5),
  ]);

  const reportingCurrency = normalizeCurrency(user.user_metadata?.preferred_currency);
  const exchangeRates = await getExchangeRates(
    ["CAD", ...(investments ?? []).map((investment) => investment.currency ?? "CAD")],
    reportingCurrency
  );
  const report = (amount: number, currency = "CAD") => amount * (exchangeRates.get(normalizeCurrency(currency)) ?? 1);

  const cashBalance =
    accounts?.reduce(
      (total, account) => total + report(Number(account.balance)),
      0
    ) ?? 0;

  const totalManualAssets =
    assets?.filter((asset) => !asset.is_ignored).reduce((total, asset) => total + report(Number(asset.value)), 0) ?? 0;

  const portfolioAssets = (portfolios ?? []).map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    isIgnored: portfolio.is_ignored,
    value:
      investments
        ?.filter((investment) => investment.portfolio === portfolio.name && !investment.is_ignored)
        .reduce((total, investment) => total + report(Number(investment.value), investment.currency), 0) ?? 0,
  }));

  const unassignedInvestments = investments?.filter((investment) => !investment.portfolio) ?? [];
  const unassignedPortfolioValue =
    unassignedInvestments
      .filter((investment) => !investment.is_ignored)
      .reduce((total, investment) => total + report(Number(investment.value), investment.currency), 0) ?? 0;

  const portfolioValue = portfolioAssets.reduce(
    (total, portfolio) => total + (portfolio.isIgnored ? 0 : portfolio.value),
    unassignedPortfolioValue
  );

  const accountAssets = (accounts ?? []).filter((account) => Number(account.balance) >= 0);
  const accountLiabilities = (accounts ?? []).filter((account) => Number(account.balance) < 0);

  const totalAccountAssets = accountAssets
    .filter((account) => !account.is_ignored)
    .reduce((total, account) => total + report(Number(account.balance)), 0);

  const totalAccountLiabilities = accountLiabilities.reduce(
    (total, liability) =>
      total + (liability.is_ignored ? 0 : Math.abs(report(Number(liability.balance)))),
    0
  );

  const totalAssets = totalManualAssets + portfolioValue + totalAccountAssets;

  const totalManualLiabilities =
    liabilities
      ?.filter((liability) => !liability.is_ignored)
      .reduce((total, liability) => total + report(Number(liability.value)), 0) ?? 0;

  const totalLiabilities = totalManualLiabilities + totalAccountLiabilities;

  const totalInvestments =
    investments?.reduce(
      (total, investment) => total + report(Number(investment.value), investment.currency),
      0
    ) ?? 0;

  const netWorth = totalAssets - totalLiabilities;

  // Build granular allocation data
  const allocationData = [
    { name: "Investments", value: totalInvestments },
    { name: "Manual Assets", value: totalManualAssets },
    { name: "Cash", value: cashBalance },
  ];

  // Build detailed breakdown
  const allocationDetails = [
    { name: "Investments", value: totalInvestments },
    ...(portfolios ?? []).map((p) => ({
      name: `  ${p.name}`,
      value: portfolioAssets.find((pa) => pa.id === p.id)?.value ?? 0,
    })),
    { name: "Manual Assets", value: totalManualAssets },
    ...(assets ?? [])
      .filter((a) => !a.is_ignored)
      .map((a) => ({
        name: `  ${a.name}`,
        value: report(Number(a.value)),
      })),
    { name: "Cash", value: cashBalance },
    ...(accounts ?? [])
      .filter((a) => Number(a.balance) >= 0 && !a.is_ignored)
      .map((a) => ({
        name: `  ${a.name}`,
        value: report(Number(a.balance)),
      })),
  ].filter((item) => item.value > 0);

  // Build top holdings data
  const topHoldings = (investments ?? [])
    .filter((inv) => !inv.is_ignored)
    .map((inv) => ({
      symbol: inv.symbol,
      name: inv.name,
      value: report(Number(inv.value), inv.currency),
    }));
  const hasFinancialRecords = Boolean((accounts?.length ?? 0) + (assets?.length ?? 0) + (liabilities?.length ?? 0) + (investments?.length ?? 0) + (portfolios?.length ?? 0));

  if (!hasFinancialRecords) {
    return (
      <div className="space-y-10">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">Welcome to <span className="text-primary">AccuWealth</span></h1>
          <p className="mt-2 text-lg text-muted-foreground">Build a complete, private picture of your finances.</p>
        </div>
        <EmptyState
          icon={LayoutDashboard}
          title="Start your financial picture"
          description="Add a cash or bank account first, then round out your net worth with assets, liabilities, and investment portfolios."
          primaryAction={<AddAccountForm />}
          secondaryAction={<div className="flex flex-wrap justify-center gap-2"><AddAssetForm compact /><AddLiabilityForm compact /><AddPortfolioForm /></div>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">

      {/* Dashboard Header */}
<div className="flex items-start justify-between">

  <div>
    <div className="flex items-center gap-2">

      <h1 className="text-4xl font-semibold tracking-tight">
        Good <span className="text-primary">evening</span>
      </h1>

      <span className="text-2xl">
        👋
      </span>

    </div>


      <p className="mt-2 text-muted-foreground text-lg">
        Here&apos;s your financial overview
      </p>


    <p className="mt-4 text-sm text-muted-foreground">
      Last updated: Today
    </p>

  </div>

</div>


      {/* Summary Cards */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Hero Card */}
  <div className="lg:col-span-2">
    <WealthCard
      title="Net Worth"
      value={formatCurrency(netWorth, reportingCurrency)}
      change="+$12,500 this month"
      icon="trend"
      featured
    />
  </div>

  <Link href="/assets" className="block">
    <WealthCard
      title="Assets"
      value={formatCurrency(totalAssets, reportingCurrency)}
      icon="home"
    />
  </Link>

  <Link href="/assets" className="block">
    <WealthCard
      title="Liabilities"
      value={formatCurrency(totalLiabilities, reportingCurrency)}
      icon="card"
    />
  </Link>

  <Link href="/accounts" className="block">
    <WealthCard
      title="Cash"
      value={formatCurrency(cashBalance, reportingCurrency)}
      icon="wallet"
    />
  </Link>

  <Link href="/investments" className="block h-full">
    <WealthCard
      title="Investments"
      value={formatCurrency(totalInvestments, reportingCurrency)}
      change="+2.5%"
      icon="piggy"
    />
  </Link>

</div>


      {/* Dashboard Sections */}
      <div className="grid gap-6">

        {/* Portfolio Performance */}
        <PortfolioPerformance hasInvestments={(investments?.length ?? 0) > 0} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocation
            data={allocationData}
            details={allocationDetails}
            currency={reportingCurrency}
          />
          <TopHoldings holdings={topHoldings} currency={reportingCurrency} />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions transactions={transactions ?? []} />

      </div>

    </div>
  );
}
