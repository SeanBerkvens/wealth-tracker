import Link from "next/link";
import { FileChartColumnIncreasing } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div><h1 className="text-4xl font-semibold tracking-tight">Reports</h1><p className="mt-1 text-lg text-muted-foreground">Insights drawn from your financial picture</p></div>
      <EmptyState icon={FileChartColumnIncreasing} title="Reports begin with your data" description="Add accounts, assets, liabilities, or investments to unlock useful views of your net worth, allocation, and progress over time." primaryAction={<Button asChild><Link href="/dashboard">Go to dashboard</Link></Button>} />
    </div>
  );
}
