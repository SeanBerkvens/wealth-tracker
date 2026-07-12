"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface LiabilityActionsProps {
  id: string;
  name: string;
  category: string;
  value: number;
  isIgnored: boolean;
  onIgnoredChange: (isIgnored: boolean) => void;
}

export default function LiabilityActions({ id, name, category, value, isIgnored, onIgnoredChange }: LiabilityActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(name);
  const [newCategory, setNewCategory] = useState(category);
  const [newValue, setNewValue] = useState(value.toString());

  async function updateLiability() {
    const { error } = await supabase
      .from("liabilities")
      .update({ name: newName, category: newCategory, value: Number(newValue) })
      .eq("id", id);

    if (error) {
      console.error(error);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  async function toggleIgnored() {
    onIgnoredChange(!isIgnored);
    const { error } = await supabase.from("liabilities").update({ is_ignored: !isIgnored }).eq("id", id);

    if (error) {
      console.error(error);
      onIgnoredChange(isIgnored);
      return;
    }

    router.refresh();
  }

  async function deleteLiability() {
    if (!confirm("Delete this liability?")) return;
    const { error } = await supabase.from("liabilities").delete().eq("id", id);
    if (!error) router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={() => setEditing(true)} className="rounded-lg border border-border bg-background px-3 py-1 text-sm btn-press">Edit</button>
        <button onClick={toggleIgnored} className="rounded-lg bg-muted/70 px-3 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground btn-press">
          {isIgnored ? "Include" : "Ignore"}
        </button>
        <button onClick={deleteLiability} className="rounded-lg bg-red-500/10 px-3 py-1 text-sm text-red-500 btn-press">Delete</button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 modal-overlay">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-card p-6 modal-content">
            <h2 className="text-xl font-semibold">Edit Liability</h2>
            <input value={newName} onChange={(event) => setNewName(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <input type="number" min="0" step="0.01" value={newValue} onChange={(event) => setNewValue(event.target.value)} className="w-full rounded-lg border border-border bg-background p-3" />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditing(false)} className="rounded-lg bg-muted px-4 py-2 btn-press">Cancel</button>
              <button onClick={updateLiability} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground btn-press">Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
