import YahooFinance from "yahoo-finance2";


const yahooFinance =
  new YahooFinance({
    suppressNotices: [
      "ripHistorical"
    ]
  });



export async function getStockPrice(
  symbol: string
) {


  const quote =
    await yahooFinance.quote(
      symbol
    );


  if (!quote.regularMarketPrice) {

    throw new Error(
      "No price returned for symbol"
    );

  }


  return quote.regularMarketPrice;


}