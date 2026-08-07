import { EmptyState } from "@/components/ui/empty-state";
import { Newspaper } from "lucide-react";

export default function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight">News</h1>
        <p className="mt-1 text-muted-foreground text-lg">
          Latest market news and updates
        </p>
      </div>

      <EmptyState icon={Newspaper} title="News tailored to your investments is on its way" description="Once market news is connected, this space will help you stay current on the companies and securities you follow." />
    </div>
  );
}
