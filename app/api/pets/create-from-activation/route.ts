import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabaseClient, getServerSupabaseClient } from "@/lib/supabase";

function generateSlug(name: string): string {
  const base = name.toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Math.random().toString(36).substring(2, 8);
  return `${base}-${suffix}`;
}

function calculateAgeFromBirthdate(birthdate?: string | null): { year: number | null; month: number | null } {
  if (!birthdate) return { year: null, month: null };
  const birth = new Date(birthdate);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (months < 0) { years--; months += 12; }
  if (years === 0 && months === 0) months = 1;
  return { year: years, month: months };
}

async function getUserId(req: NextRequest): Promise<string | null> {
  const admin = getAdminSupabaseClient();
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const { data } = await admin.auth.getUser(token);
      return data?.user?.id ?? null;
    } catch {
      // fallthrough
    }
  }
  // Explicit header fallback (client-provided). Use only if same-origin and HTTPS in production.
  const hintedUser = req.headers.get("x-user-id");
  if (hintedUser && typeof hintedUser === "string" && hintedUser.length > 0) {
    return hintedUser;
  }
  try {
    const client = await getServerSupabaseClient();
    const { data } = await client.auth.getUser();
    return data?.user?.id ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserId(req);
    if (!userId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const name = (body?.name || "").trim();
    const breed = (body?.breed || null);
    const birthdate = (body?.birthdate || null);
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    const admin = getAdminSupabaseClient();

    // 1) Ensure user has a claimed activation code without pet
    const { data: code, error: codeErr } = await admin
      .from("activation_codes")
      .select("tag_code")
      .eq("used_by", userId)
      .eq("is_used", true)
      .is("pet_id", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (codeErr) return NextResponse.json({ error: codeErr.message }, { status: 500 });
    if (!code) return NextResponse.json({ error: "No available activation code" }, { status: 409 });

    // 2) Create pet
    const { year, month } = calculateAgeFromBirthdate(birthdate);
    const { data: pet, error: petErr } = await admin
      .from("pets")
      .insert({
        name,
        breed,
        birthdate,
        tag_code: code.tag_code,
        owner_user_id: userId,
        vaccinated: ["Rabies", "DHPP / DAPP"],
        allergy_note: ["Peanuts", "Chicken", "Grass"],
        traits: ["Active", "Tries to eat things", "Friendly with cats", "Leash trained"],
        lost_mode: false,
        gender: "unknown",
        neuter_status: null,
        year,
        month,
        microchip_id: null,
        avatar_url: []
      })
      .select()
      .single();
    if (petErr) return NextResponse.json({ error: petErr.message }, { status: 500 });

    // 3) Bind activation code to the created pet via pet_id
    const { error: bindErr } = await admin
      .from("activation_codes")
      .update({ pet_id: pet.id })
      .eq("used_by", userId)
      .eq("tag_code", code.tag_code)
      .is("pet_id", null)
      .limit(1);
    if (bindErr) return NextResponse.json({ error: bindErr.message }, { status: 500 });

    return NextResponse.json({ success: true, pet });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}


