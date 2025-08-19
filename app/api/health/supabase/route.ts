import { NextResponse } from "next/server";
import { getServerSupabaseClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = await getServerSupabaseClient();
    // Lightweight check: run an RPC to fetch server time; fallback to a count on pets
    const { data: timeData } = await supabase.rpc("now").maybeSingle();
    const { error: countErr, count } = await supabase
      .from("pets")
      .select("id", { count: "exact", head: true });

    return NextResponse.json({
      ok: true,
      time: timeData ?? null,
      petsCount: count ?? null,
      countError: countErr?.message ?? null,
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}


