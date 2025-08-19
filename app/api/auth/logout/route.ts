import { getServerSupabaseClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function POST() {
  const supabase = await getServerSupabaseClient();
  
  await supabase.auth.signOut();
  
  redirect("/login");
}
