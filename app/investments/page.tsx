import { supabase } from "@/lib/supabase";
import AddInvestmentForm from "@/components/investments/add-investment-form";
import PriceRefresh from "@/components/investments/price-refresh";
import PortfolioSummaryCard from "@/components/investments/portfolio-summary-card";
import InvestmentsTable from "@/components/investments/investments-table";

export default async function InvestmentsPage() {
  const { data: investments } = await supabase
    .from("investments")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight">
            Investments
          </h1>

          <p className="mt-2 text-muted-foreground text-lg">
            Track your portfolio holdings
          </p>
        </div>

        <PriceRefresh />
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummaryCard investments={investments ?? []} />

      {/* Holdings Table Section */}
      <div className="rounded-2xl bg-card border border-border p-6 shadow-sm overflow-x-auto">

        {/* Header Row */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Holdings
          </h2>

          <AddInvestmentForm />
        </div>

        {/* TABLE MOVED TO CLIENT COMPONENT */}
        <InvestmentsTable investments={investments ?? []} />

      </div>

    </div>
  );
}