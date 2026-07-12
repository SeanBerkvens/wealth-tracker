"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UnassignedInvestmentsItem({ value, isIgnored }: { value: number; isIgnored: boolean }) {
  const router = useRouter();
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
    <div className={`rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${ignored ? "scale-[0.98] bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : "scale-100"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">Unassigned Investments</p>
          <p className="mt-1 text-sm text-muted-foreground">Synced from your investments{ignored ? " · Ignored from calculations" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleIgnored} className="rounded-lg bg-muted/70 px-3 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
            {ignored ? "Include" : "Ignore"}
          </button>
          <p className={`text-lg font-semibold transition-colors duration-300 ${ignored ? "text-zinc-600 dark:text-zinc-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            ${value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
