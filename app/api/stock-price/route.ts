import { NextResponse } from "next/server";
import { getStockPrice } from "@/lib/yahoo";


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



    const price =
      await getStockPrice(
        symbol.toUpperCase()
      );



    return NextResponse.json({
      price,
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