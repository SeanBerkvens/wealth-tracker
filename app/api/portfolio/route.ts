import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Portfolio name is required" },
        { status: 400 }
      );
    }

    // Delete all investments in this portfolio
    const { error: deleteInvError } = await supabase
      .from("investments")
      .delete()
      .eq("portfolio", name);

    if (deleteInvError) {
      console.error("Error deleting investments:", deleteInvError);
      return NextResponse.json(
        { error: "Failed to delete investments" },
        { status: 500 }
      );
    }

    // Delete the portfolio
    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .eq("name", name);

    if (deleteError) {
      console.error("Error deleting portfolio:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete portfolio" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in DELETE /api/portfolio:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}