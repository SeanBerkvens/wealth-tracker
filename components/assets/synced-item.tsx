"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, EllipsisVertical } from "lucide-react";
import { AssetIcon, assetIconOptions, iconColorOptions } from "@/components/assets/asset-icon";

type SourceTable = "accounts" | "portfolios";

export default function SyncedItem({
  id,
  table,
  name,
  description,
  value,
  isIgnored,
  liability = false,
  icon = table === "portfolios" ? "trending-up" : "landmark",
  iconColor = "#06b6d4",
}: {
  id: string;
  table: SourceTable;
  name: string;
  description: string;
  value: number;
  isIgnored: boolean;
  liability?: boolean;
  icon?: string;
  iconColor?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [ignored, setIgnored] = useState(isIgnored);
  const [menuOpen, setMenuOpen] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(icon);
  const [selectedColor, setSelectedColor] = useState(iconColor);

  useEffect(() => {
    const closeOtherMenus = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== id) {
        window.setTimeout(() => {
          setMenuOpen(false);
          setCustomizing(false);
        }, 0);
      }
    };
    window.addEventListener("asset-item-menu-open", closeOtherMenus);
    return () => window.removeEventListener("asset-item-menu-open", closeOtherMenus);
  }, [id]);

  async function toggleIgnored() {
    const nextIgnored = !ignored;
    setIgnored(nextIgnored);
    const { error } = await supabase.from(table).update({ is_ignored: nextIgnored }).eq("id", id);

    if (error) {
      console.error(error);
      setIgnored(!nextIgnored);
      return;
    }

    router.refresh();
  }

  async function saveIcon() {
    const { error } = await supabase.from(table).update({ icon: selectedIcon, icon_color: selectedColor }).eq("id", id);
    if (error) { console.error(error); return; }
    setCustomizing(false); router.refresh();
  }

  function toggleMenu() {
    if (!menuOpen) window.dispatchEvent(new CustomEvent("asset-item-menu-open", { detail: id }));
    setMenuOpen(!menuOpen);
  }

  return (
    <div className={`relative rounded-xl bg-muted p-4 card-hover transition-all duration-300 ease-out ${menuOpen || customizing ? "z-30" : "z-0"} ${ignored ? "bg-zinc-200/60 opacity-80 dark:bg-zinc-800/70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center"><AssetIcon name={selectedIcon} color={selectedColor} className="h-6 w-6" /></div>
          <div className="relative">
            <button type="button" onClick={toggleMenu} title="Item options" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground btn-press"><EllipsisVertical className="h-6 w-6" /></button>
            {menuOpen && <div className="option-menu absolute left-0 z-20 mt-1 w-36 rounded-lg border border-border bg-popover p-1 shadow-lg"><button type="button" onClick={() => { setCustomizing(true); setMenuOpen(false); }} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">Change icon</button></div>}
          </div>
          <div>
          <p className="font-semibold">{name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}{ignored ? " · Ignored from calculations" : ""}</p>
        </div>
          </div>
        <div className="flex self-center items-center gap-3">
          <p className={`whitespace-nowrap text-lg font-semibold transition-colors duration-300 ${ignored ? "text-zinc-600 dark:text-zinc-500" : liability ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
            ${value.toLocaleString()}
          </p>
          <button type="button" onClick={toggleIgnored} title={ignored ? "Include in calculations" : "Ignore from calculations"} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
            {ignored ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {customizing && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-overlay"><div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 modal-content"><h2 className="text-xl font-semibold">Change icon</h2><div className="grid grid-cols-4 gap-2">{assetIconOptions.map((option) => <button key={option.value} type="button" onClick={() => setSelectedIcon(option.value)} className={`flex flex-col items-center gap-1 rounded-lg border p-2 text-xs ${selectedIcon === option.value ? "border-primary bg-primary/10 text-primary" : "border-border"}`}><AssetIcon name={option.value} />{option.label}</button>)}</div><div className="flex flex-wrap gap-2">{iconColorOptions.map((color) => <button key={color} type="button" onClick={() => setSelectedColor(color)} aria-label={`Use ${color}`} className={`h-7 w-7 rounded-full border-2 ${selectedColor === color ? "border-foreground" : "border-transparent"}`} style={{ backgroundColor: color }} />)}</div><div className="flex justify-end gap-3"><button type="button" onClick={() => setCustomizing(false)} className="rounded-lg bg-muted px-4 py-2 btn-press">Cancel</button><button type="button" onClick={saveIcon} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground btn-press">Save</button></div></div></div>}
    </div>
  );
}
