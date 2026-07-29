"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/auth-provider";

type TransactionType = "buy" | "sell";

type HoldingTransaction = {
  id: string;
  date: string;
  type: TransactionType;
  shares: number | string;
  price: number | string;
  commission: number | string | null;
  note: string | null;
};

type TransactionDraft = {
  date: string;
  type: TransactionType;
  shares: string;
  price: string;
  commission: string;
  note: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyDraft = (): TransactionDraft => ({
  date: today(),
  type: "buy",
  shares: "",
  price: "",
  commission: "0",
  note: "",
});

export default function HoldingTransactions({
  investmentId,
  symbol,
  columnCount,
  startNewTransaction = false,
  onSuccess,
}: {
  investmentId: string;
  symbol: string;
  columnCount: number;
  startNewTransaction?: boolean;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const supabase = createClient();
  const [transactions, setTransactions] = useState<HoldingTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(startNewTransaction ? "new" : null);
  const [draft, setDraft] = useState<TransactionDraft>(emptyDraft);

  const loadTransactions = async () => {
    if (!user) return;

    const { data, error: loadError } = await supabase
      .from("transactions")
      .select("id, date, type, shares, price, commission, note")
      .eq("investment_id", investmentId)
      .eq("user_id", user.id)
      .order("date", { ascending: true })
      .order("created_at", { ascending: true });

    if (loadError) {
      setError(loadError.message);
    } else {
      setTransactions(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    void Promise.resolve().then(loadTransactions);
  }, [investmentId, user?.id]);

  const updateDraft = (field: keyof TransactionDraft, value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const startEditing = (transaction: HoldingTransaction) => {
    setEditingId(transaction.id);
    setError(null);
    setDraft({
      date: transaction.date,
      type: transaction.type,
      shares: String(transaction.shares),
      price: String(transaction.price),
      commission: String(transaction.commission ?? 0),
      note: transaction.note ?? "",
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError(null);
    setDraft(emptyDraft());
  };

  const saveTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;

    const shares = Number(draft.shares);
    const price = Number(draft.price);
    const commission = Number(draft.commission || 0);

    if (!draft.date || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(price) || price < 0 || !Number.isFinite(commission) || commission < 0) {
      setError("Enter a valid date, positive share count, price, and non-negative commission.");
      return;
    }

    setSaving(true);
    setError(null);
    const values = {
      date: draft.date,
      type: draft.type,
      shares,
      price,
      commission,
      note: draft.note.trim() || null,
      investment_id: investmentId,
      user_id: user.id,
    };

    const { error: saveError } = editingId && editingId !== "new"
      ? await supabase.from("transactions").update(values).eq("id", editingId).eq("user_id", user.id)
      : await supabase.from("transactions").insert({ ...values, symbol });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    cancelEditing();
    await loadTransactions();
    onSuccess?.();
    setSaving(false);
  };

  const deleteTransaction = async (transactionId: string) => {
    if (!user || !window.confirm("Delete this transaction?")) return;

    setError(null);
    const { error: deleteError } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transactionId)
      .eq("user_id", user.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    await loadTransactions();
    onSuccess?.();
  };

  return (
    <tr className="border-b border-border bg-muted/20">
      <td colSpan={columnCount} className="p-4 sm:p-5">
        <div className="rounded-xl border border-border bg-background p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">{symbol} transactions</h3>
              <p className="text-xs text-muted-foreground">Cost basis is recalculated using weighted average after each change.</p>
            </div>
            {!editingId && (
              <button type="button" onClick={() => setEditingId("new")} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground btn-press">
                Add transaction
              </button>
            )}
          </div>

          {error && <p className="mb-3 rounded-md bg-red-500/10 p-2 text-sm text-red-600">{error}</p>}

          {editingId && (
            <form onSubmit={saveTransaction} className="mb-4 grid gap-3 rounded-lg border border-border p-3 md:grid-cols-6">
              <input aria-label="Transaction date" type="date" value={draft.date} onChange={(event) => updateDraft("date", event.target.value)} className="rounded-md border border-border bg-background p-2" />
              <select aria-label="Transaction type" value={draft.type} onChange={(event) => updateDraft("type", event.target.value)} className="rounded-md border border-border bg-background p-2">
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
              <input aria-label="Shares" type="number" min="0" step="any" placeholder="Shares" value={draft.shares} onChange={(event) => updateDraft("shares", event.target.value)} className="rounded-md border border-border bg-background p-2" />
              <input aria-label="Price per share" type="number" min="0" step="0.01" placeholder="Price/share" value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} className="rounded-md border border-border bg-background p-2" />
              <input aria-label="Commission" type="number" min="0" step="0.01" placeholder="Commission" value={draft.commission} onChange={(event) => updateDraft("commission", event.target.value)} className="rounded-md border border-border bg-background p-2" />
              <input aria-label="Note" placeholder="Note (optional)" value={draft.note} onChange={(event) => updateDraft("note", event.target.value)} className="rounded-md border border-border bg-background p-2" />
              <div className="md:col-span-6 flex justify-end gap-2">
                <button type="button" onClick={cancelEditing} className="rounded-md bg-muted px-3 py-2 text-sm btn-press">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground btn-press disabled:opacity-50">
                  {saving ? "Saving..." : editingId === "new" ? "Add transaction" : "Save changes"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions recorded for this holding yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-muted-foreground">
                  <tr><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2 text-right">Shares</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Commission</th><th className="p-2">Note</th><th className="p-2" /></tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-border last:border-0">
                      <td className="p-2">{transaction.date}</td>
                      <td className="p-2 capitalize">{transaction.type}</td>
                      <td className="p-2 text-right">{Number(transaction.shares).toLocaleString()}</td>
                      <td className="p-2 text-right">${Number(transaction.price).toLocaleString()}</td>
                      <td className="p-2 text-right">${Number(transaction.commission ?? 0).toLocaleString()}</td>
                      <td className="p-2 text-muted-foreground">{transaction.note || "—"}</td>
                      <td className="p-2 text-right whitespace-nowrap"><button type="button" onClick={() => startEditing(transaction)} className="mr-3 text-primary">Edit</button><button type="button" onClick={() => void deleteTransaction(transaction.id)} className="text-red-500">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}
