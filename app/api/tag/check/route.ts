import { type NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient, getServerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/tag/check?id=<tagCode>
 *
 * Returns the status of a tag code without exposing activation_codes directly
 * to the browser (admin client bypasses RLS).
 *
 * Response shapes:
 *   { exists: false }
 *   { exists: true, isUsed: false }
 *   { exists: true, isUsed: true, hasPet: boolean, isOwner: boolean }
 */
export async function GET(req: NextRequest) {
  const tagCode = (req.nextUrl.searchParams.get("id") || "").trim();

  if (!tagCode) {
    return NextResponse.json({ exists: false });
  }

  try {
    const admin = getAdminSupabaseClient();

    // 1. Check tag exists + used status
    const { data: tagData, error: tagError } = await admin
      .from("activation_codes")
      .select("tag_code, is_used, used_by")
      .eq("tag_code", tagCode)
      .maybeSingle();

    if (tagError) {
      return NextResponse.json({ error: tagError.message }, { status: 500 });
    }

    if (!tagData) {
      return NextResponse.json({ exists: false });
    }

    if (!tagData.is_used) {
      return NextResponse.json({ exists: true, isUsed: false });
    }

    // 2. Tag is used — check if pet exists
    const { data: pet } = await admin
      .from("pets")
      .select("id")
      .eq("tag_code", tagCode)
      .maybeSingle();

    const hasPet = !!pet;

    // 3. Determine if the calling user is the owner (via session cookie)
    let isOwner = false;
    if (tagData.used_by) {
      try {
        const userClient = await getServerSupabaseClient();
        const {
          data: { user },
        } = await userClient.auth.getUser();
        isOwner = !!user && user.id === tagData.used_by;
      } catch {
        // Not authenticated or expired session — isOwner stays false
      }
    }

    return NextResponse.json({ exists: true, isUsed: true, hasPet, isOwner });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
