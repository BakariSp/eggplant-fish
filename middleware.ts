import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  // Prepare response so Supabase can refresh cookies
  const res = NextResponse.next();
  try {
    const supabase = createMiddlewareClient({ req, res });
    const { data: { session } } = await supabase.auth.getSession();

    // Mirror basic identity into cookies for SSR fallback
    const userId = session?.user?.id || "";
    const userEmail = session?.user?.email || "";
    // Non-HttpOnly so both SSR and CSR can read if needed; adjust per security needs
    res.cookies.set("x-user-id", userId, { path: "/", sameSite: "lax" });
    res.cookies.set("x-user-email", userEmail, { path: "/", sameSite: "lax" });
  } catch (_) {
    // Ignore errors; page-level guard will handle
  }
  return res;
}

export const config = {
  matcher: [
    "/dashboard/:path*"
  ]
};
