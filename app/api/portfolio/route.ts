import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Portfolio name is required" },
        { status: 400 }
      );
    }

    // Create authenticated server client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Delete all investments in this portfolio (scoped to user)
    const { error: deleteInvError } = await supabase
      .from("investments")
      .delete()
      .eq("portfolio", name)
      .eq("user_id", userId);

    if (deleteInvError) {
      console.error("Error deleting investments:", deleteInvError);
      return NextResponse.json(
        { error: "Failed to delete investments" },
        { status: 500 }
      );
    }

    // Delete the portfolio (scoped to user)
    const { error: deleteError } = await supabase
      .from("portfolios")
      .delete()
      .eq("name", name)
      .eq("user_id", userId);

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
