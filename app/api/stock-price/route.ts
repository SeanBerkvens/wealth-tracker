import { NextResponse } from "next/server";
import { getStockQuote } from "@/lib/yahoo";


export async function GET(
  request: Request
) {

  try {

    const { searchParams } =
      new URL(request.url);


    const symbol =
      searchParams.get("symbol");


    if (!symbol) {

      return NextResponse.json(
        {
          error: "Missing symbol"
        },
        {
          status: 400
        }
      );

    }



    const quote =
      await getStockQuote(
        symbol.toUpperCase()
      );



    return NextResponse.json({
      price: quote.price,
      currency: quote.currency,
    });



  } 
  catch (error: any) {


  console.error(
    "Stock price error:",
    error
  );


  return NextResponse.json(
    {
      error:
        error?.message ||
        JSON.stringify(error) ||
        "Unknown error"
    },
    {
      status: 500
    }
  );


}

}
