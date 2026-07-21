"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";

export default function AddPortfolioForm({
  onSuccess,
}: {
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;
    if (!user) return;

    setSaving(true);

    const { error } = await supabase.from("portfolios").insert({
      name: name.trim(),
      user_id: user.id,
    });

    setSaving(false);

    if (error) {
      console.error("Failed to create portfolio:", error);
      return;
    }

    setOpen(false);
    setName("");
    onSuccess?.();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full border border-border bg-card text-card-foreground hover:bg-muted transition btn-press"
      >
        + Portfolio
      </button>

      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 modal-overlay">
          <div className="w-full max-w-md p-6 rounded-xl bg-card text-card-foreground border border-border relative modal-content">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>

            <h2 className="text-lg font-semibold mb-4">Add Portfolio</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Portfolio name (e.g. Wealthsimple, Questrade)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-lg bg-background text-foreground"
                autoFocus
              />

              <p className="text-xs text-muted-foreground">
                After creating, tag your transactions with this portfolio name.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition btn-press disabled:opacity-50"
              >
                {saving ? "Creating..." : "Create Portfolio"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}