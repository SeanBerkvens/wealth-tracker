"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";


export default function PriceRefresh() {


  const router = useRouter();


  const [refreshing, setRefreshing] =
    useState(false);


  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);



  async function refreshPrices() {


    setRefreshing(true);



    await fetch(
      "/api/refresh-prices",
      {
        method: "POST",
      }
    );



    router.refresh();



    setLastUpdated(
      new Date()
    );


    setRefreshing(false);


  }



  useEffect(() => {


    refreshPrices();



    const interval =
      setInterval(
        refreshPrices,
        60000
      );



    return () =>
      clearInterval(interval);



  }, []);




  return (

    <div
      className="
        flex
        items-center
        gap-2
        text-sm
        text-muted-foreground
      "
    >

      <RefreshCw
        size={15}
        className={
          refreshing
            ? "animate-spin"
            : ""
        }
      />


      <span>

        {refreshing
          ? "Updating prices..."
          : lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString()}`
            : "Updating prices..."
        }

      </span>


    </div>

  );

}