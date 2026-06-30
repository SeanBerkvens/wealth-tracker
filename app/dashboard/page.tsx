import WealthCard from "@/components/dashboard/wealth-card";

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        <WealthCard
          title="Net Worth"
          value="$500,000"
        />

        <WealthCard
          title="Assets"
          value="$650,000"
        />

        <WealthCard
          title="Liabilities"
          value="$150,000"
        />

        <WealthCard
          title="Cash"
          value="$25,000"
        />

        <WealthCard
          title="Investments"
          value="$400,000"
        />

      </div>
    </div>
  );
}