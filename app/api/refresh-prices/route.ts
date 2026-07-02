import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getStockPrice } from "@/lib/yahoo";


export async function POST() {


  const { data: investments } =
    await supabase
      .from("investments")
      .select("*");



  if (!investments) {

    return NextResponse.json({
      updated: 0
    });

  }



  for (const investment of investments) {


    const price =
      await getStockPrice(
        investment.symbol
      );



    const value =
      Number(investment.shares) *
      Number(price);



    await supabase
      .from("investments")
      .update({

        current_price:
          price,

        value,

      })

      .eq(
        "id",
        investment.id
      );


  }



  return NextResponse.json({

    updated:
      investments.length

  });


}