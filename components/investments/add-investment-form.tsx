"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";


export default function AddInvestmentForm() {


  const [open, setOpen] = useState(false);

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [shares, setShares] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");

  const [loading, setLoading] = useState(false);



  async function addInvestment() {


    setLoading(true);



    const response =
      await fetch(
        `/api/stock-price?symbol=${symbol.toUpperCase()}`
      );



    if (!response.ok) {

      const error =
        await response.json();


      console.error(
        "Stock API error:",
        error
      );


      alert(
        error.error
      );


      setLoading(false);

      return;

    }



    const stockData =
      await response.json();



    const currentPrice =
      Number(stockData.price);



    const value =
      Number(shares) *
      currentPrice;



    const { error } = await supabase
      .from("investments")
      .insert({

        name,

        symbol:
          symbol.toUpperCase(),

        shares:
          Number(shares),

        purchase_price:
          Number(purchasePrice),

        current_price:
          currentPrice,

        value,

      });



    if (error) {

      console.error(error);

      setLoading(false);

      return;

    }



    setOpen(false);

    window.location.reload();


  }




  return (

    <>

      {/* Add Button */}

<button
  onClick={() => setOpen(true)}
  className="
    flex
    items-center
    gap-2
    rounded-full
    bg-primary
    px-5
    py-2
    text-primary-foreground
    font-semibold
    shadow-sm
  "
>
  <span className="text-xl">
    +
  </span>

  Add
</button>





      {open && (

        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/40
            p-4
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
              Add Investment
            </h2>



            <input
              placeholder="Company Name"
              value={name}
              onChange={(e)=>setName(e.target.value)}
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
              placeholder="Ticker Symbol (AAPL)"
              value={symbol}
              onChange={(e)=>setSymbol(e.target.value)}
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
              placeholder="Shares"
              value={shares}
              onChange={(e)=>setShares(e.target.value)}
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
              placeholder="Purchase Price"
              value={purchasePrice}
              onChange={(e)=>setPurchasePrice(e.target.value)}
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
                onClick={() => setOpen(false)}
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
                disabled={loading}
                onClick={addInvestment}
                className="
                  rounded-lg
                  bg-primary
                  px-4
                  py-2
                  text-primary-foreground
                "
              >

                {loading
                  ? "Fetching..."
                  : "Save"
                }

              </button>


            </div>



          </div>


        </div>

      )}


    </>

  );

}