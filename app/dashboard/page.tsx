import Link from "next/link";
import { redirect } from "next/navigation";
import WealthCard from "@/components/dashboard/wealth-card";
import { AssetAllocation } from "@/components/dashboard/asset-allocation";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import PortfolioPerformance from "@/components/dashboard/portfolio-performance";
import TopHoldings from "@/components/dashboard/top-holdings";
import { createClient } from "@/lib/supabase/server";

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
        value: Number(a.value),
      })),
    { name: "Cash", value: cashBalance },
    ...(accounts ?? [])
      .filter((a) => Number(a.balance) >= 0 && !a.is_ignored)
      .map((a) => ({
        name: `  ${a.name}`,
        value: Number(a.balance),
      })),
  ].filter((item) => item.value > 0);

  // Build top holdings data
  const topHoldings = (investments ?? [])
    .filter((inv) => !inv.is_ignored)
    .map((inv) => ({
      symbol: inv.symbol,
      name: inv.name,
      value: Number(inv.value),
    }));

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
        Here's your financial overview
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

  <Link href="/investments" className="block h-full">
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

        {/* Portfolio Performance */}
        <PortfolioPerformance />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AssetAllocation
            data={allocationData}
            details={allocationDetails}
          />
          <TopHoldings holdings={topHoldings} />
        </div>

        {/* Recent Transactions */}
        <RecentTransactions transactions={transactions ?? []} />

      </div>

    </div>
  );
}