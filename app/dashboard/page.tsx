import Link from "next/link";
import WealthCard from "@/components/dashboard/wealth-card";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AssetAllocation } from "@/components/dashboard/asset-allocation";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/theme-toggle";

export default async function DashboardPage() {
  const [
    { data: accounts },
    { data: assets },
    { data: liabilities },
    { data: investments },
    { data: portfolios },
  ] = await Promise.all([
    supabase.from("accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("assets").select("*").order("created_at", { ascending: false }),
    supabase.from("liabilities").select("*").order("created_at", { ascending: false }),
    supabase.from("investments").select("*").order("created_at", { ascending: false }),
    supabase.from("portfolios").select("id, name, is_ignored").order("name", { ascending: true }),
  ]);

  const cashBalance =
    accounts?.reduce(
      (total, account) => total + Number(account.balance),
      0
    ) ?? 0;

  const totalManualAssets =
    assets?.filter((asset) => !asset.is_ignored).reduce((total, asset) => total + Number(asset.value), 0) ?? 0;

  const portfolioAssets = (portfolios ?? []).map((portfolio) => ({
    id: portfolio.id,
    name: portfolio.name,
    isIgnored: portfolio.is_ignored,
    value:
      investments
        ?.filter((investment) => investment.portfolio === portfolio.name && !investment.is_ignored)
        .reduce((total, investment) => total + Number(investment.value), 0) ?? 0,
  }));

  const unassignedInvestments = investments?.filter((investment) => !investment.portfolio) ?? [];
  const unassignedPortfolioValue =
    unassignedInvestments
      .filter((investment) => !investment.is_ignored)
      .reduce((total, investment) => total + Number(investment.value), 0) ?? 0;

  const portfolioValue = portfolioAssets.reduce(
    (total, portfolio) => total + (portfolio.isIgnored ? 0 : portfolio.value),
    unassignedPortfolioValue
  );

  const accountAssets = (accounts ?? []).filter((account) => Number(account.balance) >= 0);
  const accountLiabilities = (accounts ?? []).filter((account) => Number(account.balance) < 0);

  const totalAccountAssets = accountAssets
    .filter((account) => !account.is_ignored)
    .reduce((total, account) => total + Number(account.balance), 0);

  const totalAccountLiabilities = accountLiabilities.reduce(
    (total, liability) =>
      total + (liability.is_ignored ? 0 : Math.abs(Number(liability.balance))),
    0
  );

  const totalAssets = totalManualAssets + portfolioValue + totalAccountAssets;

  const totalManualLiabilities =
    liabilities
      ?.filter((liability) => !liability.is_ignored)
      .reduce((total, liability) => total + Number(liability.value), 0) ?? 0;

  const totalLiabilities = totalManualLiabilities + totalAccountLiabilities;

  const totalInvestments =
    investments?.reduce(
      (total, investment) => total + Number(investment.value),
      0
    ) ?? 0;

  const netWorth = totalAssets - totalLiabilities;

  const { data: history } = await supabase
    .from("net_worth_history")
    .select("*")
    .order("date");

  const allocationData = [
    { name: "Investments", value: totalInvestments },
    { name: "Real Estate", value: totalManualAssets },
    { name: "Cash", value: cashBalance },
  ];

 
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


  <ThemeToggle />

</div>


      {/* Summary Cards */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

  {/* Hero Card */}
  <div className="lg:col-span-2">
    <WealthCard
      title="Net Worth"
      value={`$${netWorth.toLocaleString()}`}
      change="+$12,500 this month"
      icon="trend"
      featured
    />
  </div>

  <Link href="/assets" className="block">
    <WealthCard
      title="Assets"
      value={`$${totalAssets.toLocaleString()}`}
      icon="home"
    />
  </Link>

  <Link href="/assets" className="block">
    <WealthCard
      title="Liabilities"
      value={`$${totalLiabilities.toLocaleString()}`}
      icon="card"
    />
  </Link>

  <Link href="/accounts" className="block">
    <WealthCard
      title="Cash"
      value={`$${cashBalance.toLocaleString()}`}
      icon="wallet"
    />
  </Link>

  <Link href="/investments" className="block">
    <WealthCard
      title="Investments"
      value={`$${totalInvestments.toLocaleString()}`}
      change="+2.5%"
      icon="piggy"
    />
  </Link>

</div>


      {/* Dashboard Sections */}
      <div className="grid gap-6">

        <NetWorthChart data={history ?? []} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AssetAllocation data={allocationData} />
          <RecentTransactions />
        </div>

      </div>

    </div>
  );
}