"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EllipsisVertical, Eye, EyeOff } from "lucide-react";
import { AssetIcon } from "@/components/assets/asset-icon";

export default function UnassignedInvestmentsItem({ value, isIgnored }: { value: number; isIgnored: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [ignored, setIgnored] = useState(isIgnored);

  async function toggleIgnored() {
    const nextIgnored = !ignored;
    setIgnored(nextIgnored);
    const { error } = await supabase.from("investments").update({ is_ignored: nextIgnored }).is("portfolio", null);

    if (error) {
      console.error(error);
      setIgnored(!nextIgnored);
      return;
    }

    router.refresh();
  }

  return (
    <div className={`rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${ignored ? "bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center">
            <AssetIcon name="trending-up" color="#06b6d4" className="h-6 w-6" />
          </div>
          <div className="flex h-11 w-10 shrink-0 items-center justify-center text-muted-foreground" aria-hidden="true">
            <EllipsisVertical className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold">Unassigned Investments</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Synced from your investments{ignored ? " · Ignored from calculations" : ""}
            </p>
          </div>
        </div>
        <div className="flex self-center items-center gap-3">
          <p className={`whitespace-nowrap text-lg font-semibold transition-colors duration-300 ${ignored ? "text-zinc-600 dark:text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            ${value.toLocaleString()}
          </p>
          <button type="button" onClick={toggleIgnored} title={ignored ? "Include in calculations" : "Ignore from calculations"} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
            {ignored ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
