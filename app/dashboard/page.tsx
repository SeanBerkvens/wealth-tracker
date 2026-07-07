import WealthCard from "@/components/dashboard/wealth-card";
import { NetWorthChart } from "@/components/dashboard/net-worth-chart";
import { AssetAllocation } from "@/components/dashboard/asset-allocation";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { supabase } from "@/lib/supabase";
import ThemeToggle from "@/components/theme-toggle";

export default async function DashboardPage() {
  
  const { data: accounts } = await supabase
  .from("accounts")
  .select("*");

  const cashBalance =
  accounts?.reduce(
    (total, account) => total + Number(account.balance),
    0
  ) ?? 0;

  const { data: assets } = await supabase
  .from("assets")
  .select("*");

  const totalAssets =
  assets?.reduce(
    (total, asset) => total + Number(asset.value),
    0
  ) ?? 0;

  const { data: liabilities } = await supabase
  .from("liabilities")
  .select("*");

  const totalLiabilities =
  liabilities?.reduce(
    (total, liability) =>
      total + Number(liability.value),
    0
  ) ?? 0;

  const { data: investments } = await supabase
  .from("investments")
  .select("*");

  const totalInvestments =
  investments?.reduce(
    (total, investment) =>
      total + Number(investment.value),
    0
  ) ?? 0;

  const netWorth =
  cashBalance +
  totalAssets +
  totalInvestments -
  totalLiabilities;

  const { data: history } = await supabase
  .from("net_worth_history")
  .select("*")
  .order("date");

  const allocationData = [
    { name: "Investments", value: totalInvestments },
    { name: "Real Estate", value: totalAssets },
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
        Here's your financial overview
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


  <WealthCard
  title="Assets"
  value={`$${totalAssets.toLocaleString()}`}
  icon="home"
/>


  <WealthCard
  title="Liabilities"
  value={`$${totalLiabilities.toLocaleString()}`}
  icon="card"
/>


  <WealthCard
  title="Cash"
  value={`$${cashBalance.toLocaleString()}`}
  icon="wallet"
/>


  <WealthCard
  title="Investments"
  value={`$${totalInvestments.toLocaleString()}`}
  change="+2.5%"
  icon="piggy"
/>

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