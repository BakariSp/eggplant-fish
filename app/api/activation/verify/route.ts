import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient, getServerSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const tag_code = (body?.tag_code || "").trim();
    const box_code = (body?.box_code || "").trim().toUpperCase();
    if (!tag_code || !box_code) {
      return NextResponse.json({ error: "Missing tag_code or box_code" }, { status: 400 });
    }
    const admin = getAdminSupabaseClient();
    // Verify tag_code exists (and not already used)
    const { data: tagData, error: tagError } = await admin
      .from("activation_codes")
      .select("tag_code, is_used")
      .eq("tag_code", tag_code)
      .maybeSingle();
    if (tagError) {
      return NextResponse.json({ error: tagError.message }, { status: 500 });
    }
    if (!tagData) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }
    if (tagData.is_used) {
      return NextResponse.json({ error: "This code has already been used" }, { status: 409 });
    }
    // Verify box_code exists (independent of tag_code)
    const { data: boxRows, error: boxError } = await admin
      .from("activation_codes")
      .select("box_code")
      .eq("box_code", box_code)
      .limit(1);
    if (boxError) {
      return NextResponse.json({ error: boxError.message }, { status: 500 });
    }
    if (!boxRows || boxRows.length === 0) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 });
    }

    // Try to get the authenticated user from Authorization header first, then cookies
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const { data: userData } = await admin.auth.getUser(token);
        userId = userData?.user?.id ?? null;
      } catch {
        userId = null;
      }
    }
    if (!userId) {
      try {
        const userClient = await getServerSupabaseClient();
        const { data: userData } = await userClient.auth.getUser();
        userId = userData?.user?.id ?? null;
      } catch {
        userId = null;
      }
    }

    // If the user is authenticated, claim the code: mark is_used and used_by
    if (userId) {
      const { error: updateErr } = await admin
        .from("activation_codes")
        .update({ is_used: true, used_by: userId, used_at: new Date().toISOString() })
        .eq("tag_code", tag_code)
        .eq("is_used", false);
      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, claimed: true });
    }

    // Not authenticated yet → only verify existence; client can authenticate then call again to claim
    return NextResponse.json({ success: true, claimed: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


