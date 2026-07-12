"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


interface InvestmentActionsProps {
  id: string;
  name: string;
  symbol: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate?: string;
  portfolio?: string | null;
  portfolios?: string[];
  onSuccess?: () => void;
}


export default function InvestmentActions({
  id,
  name,
  symbol,
  shares,
  purchasePrice,
  currentPrice,
  purchaseDate,
  portfolio,
  portfolios = [],
  onSuccess,
}: InvestmentActionsProps) {


  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);


  const [newName, setNewName] = useState(name);
  const [newSymbol, setNewSymbol] = useState(symbol);
  const [newShares, setNewShares] = useState(
    shares.toString()
  );
  const [newPurchasePrice, setNewPurchasePrice] =
    useState(purchasePrice.toString());

  const [newCurrentPrice, setNewCurrentPrice] =
    useState(currentPrice.toString());

  const [newPortfolio, setNewPortfolio] = useState(portfolio || "");

  const [newPurchaseDate, setNewPurchaseDate] = useState(
    purchaseDate || new Date().toISOString().split("T")[0]
  );



  async function updateInvestment() {

    setSaving(true);


    const value =
      Number(newShares) *
      Number(newCurrentPrice);



    const { error } = await supabase
      .from("investments")
      .update({
        name: newName,
        symbol: newSymbol,
        shares: Number(newShares),
        purchase_price: Number(newPurchasePrice),
        current_price: Number(newCurrentPrice),
        value,
        purchase_date: newPurchaseDate,
        portfolio: newPortfolio || null,
      })
      .eq("id", id);



    if (error) {
      console.error(error);
      setSaving(false);
      return;
    }


    setEditing(false);

    onSuccess?.();

  }




  async function deleteInvestment() {

    const confirmed = window.confirm(
      "Delete this investment?"
    );


    if (!confirmed) return;



    const { error } = await supabase
      .from("investments")
      .delete()
      .eq("id", id);



    if (error) {
      console.error(error);
      return;
    }


    onSuccess?.();

  }




  return (

    <>

      <div className="flex justify-end gap-2">


        <button
          type="button"
          onClick={() => setEditing(true)}
          className="
            rounded-lg
            bg-background
            border
            border-border
            px-3
            py-1
            text-sm
          "
        >
          Edit
        </button>


        <button
          type="button"
          onClick={deleteInvestment}
          className="
            rounded-lg
            bg-red-500/10
            px-3
            py-1
            text-sm
            text-red-500
          "
        >
          Delete
        </button>


      </div>




      {editing && (

        <div
          className="
            fixed
            inset-0
            flex
            items-center
            justify-center
            bg-black/40
            z-50
          "
        >


          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              bg-card
              border
              border-border
              p-6
              space-y-4
            "
          >


            <h2 className="text-xl font-semibold">
              Edit Investment
            </h2>



            <input
              value={newName}
              onChange={(e)=>setNewName(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              value={newSymbol}
              onChange={(e)=>setNewSymbol(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              type="number"
              value={newShares}
              onChange={(e)=>setNewShares(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              type="number"
              value={newPurchasePrice}
              onChange={(e)=>setNewPurchasePrice(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />


            <input
              type="number"
              value={newCurrentPrice}
              onChange={(e)=>setNewCurrentPrice(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />

            <label className="text-xs text-muted-foreground block">
              Portfolio
            </label>
            <select
              value={newPortfolio}
              onChange={(e) => setNewPortfolio(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            >
              <option value="">Unassigned</option>
              {portfolios.map((portfolioItem) => (
                <option key={portfolioItem} value={portfolioItem}>
                  {portfolioItem}
                </option>
              ))}
            </select>

            {/* PURCHASE DATE */}
            <label className="text-xs text-muted-foreground block">
              Purchase Date
            </label>
            <input
              type="date"
              value={newPurchaseDate}
              onChange={(e)=>setNewPurchaseDate(e.target.value)}
              className="
                w-full
                rounded-lg
                border
                border-border
                bg-background
                p-3
              "
            />

            <div className="flex justify-end gap-3">


              <button
                type="button"
                onClick={() => setEditing(false)}
                className="
                  rounded-lg
                  bg-muted
                  px-4
                  py-2
                "
              >
                Cancel
              </button>



              <button
                type="button"
                disabled={saving}
                onClick={updateInvestment}
                className="
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-primary-foreground
                "
              >
                {saving ? "Saving..." : "Save"}
              </button>


            </div>


          </div>


        </div>

      )}


    </>

  );

}