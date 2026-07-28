"use client";

import { useState } from "react";
import LiabilityActions from "@/components/liabilities/liability-actions";
import { AssetIcon } from "@/components/assets/asset-icon";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Liability = {
  id: string;
  name: string;
  category: string;
  value: number;
  is_ignored?: boolean;
  updated_at?: string;
  created_at?: string;
  icon?: string;
  icon_color?: string;
};

function formatUpdatedAt(timestamp?: string) {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "long" });
  const day = date.getDate();
  const year = date.getFullYear();

  const suffix = (() => {
    if (day % 10 === 1 && day !== 11) return "st";
    if (day % 10 === 2 && day !== 12) return "nd";
    if (day % 10 === 3 && day !== 13) return "rd";
    return "th";
  })();

  return `Last updated on ${weekday} ${month} ${day}${suffix}, ${year}`;
}

export default function LiabilityItem({ liability }: { liability: Liability }) {
  const router = useRouter();
  const supabase = createClient();
  const [isIgnored, setIsIgnored] = useState(liability.is_ignored ?? false);
  const updatedLabel = formatUpdatedAt(liability.updated_at || liability.created_at);

  async function toggleIgnored() {
    const nextIgnored = !isIgnored;
    setIsIgnored(nextIgnored);
    const { error } = await supabase.from("liabilities").update({ is_ignored: nextIgnored }).eq("id", liability.id);
    if (error) {
      console.error(error);
      setIsIgnored(!nextIgnored);
      return;
    }
    router.refresh();
  }

  return (
    <div
      className={`rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${
        isIgnored ? "bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center"><AssetIcon name={liability.icon} color={liability.icon_color} className="h-6 w-6" /></div>
          <LiabilityActions id={liability.id} name={liability.name} category={liability.category} value={Number(liability.value)} icon={liability.icon ?? "landmark"} iconColor={liability.icon_color ?? "#ef4444"} />
          <div className="min-w-0"><p className="font-semibold">{liability.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {liability.category}{isIgnored ? " · Ignored from calculations" : ""}
          </p>
          {updatedLabel && (
            <p className="mt-2 text-sm text-muted-foreground">{updatedLabel}</p>
          )}
          </div>
        </div>

        <div className="flex self-center items-center gap-3">
          <p className={`whitespace-nowrap text-lg font-semibold transition-colors duration-300 ${isIgnored ? "text-zinc-600 dark:text-zinc-500" : "text-red-500"}`}>
            ${Number(liability.value).toLocaleString()}
          </p>
          <button type="button" onClick={toggleIgnored} title={isIgnored ? "Include in calculations" : "Ignore from calculations"} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
            {isIgnored ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
