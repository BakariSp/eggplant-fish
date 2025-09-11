import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase";
import { 
  verificationCodeSchema, 
  validateInput, 
  withErrorHandler, 
  createSuccessResponse,
  createBadRequestError,
  createInternalError
} from "@/lib/validation";

async function handleVerifyCode(request: NextRequest) {
  const body = await request.json();
  
  // Validate input
  const validatedInput = validateInput(verificationCodeSchema, body);
  const { code, session: sessionData } = validatedInput as { code: string; session?: { access_token?: string; refresh_token?: string } };

    // Create supabase client for API route
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options?: Record<string, unknown>) {
            try {
              cookieStore.set({ name, value, ...(options ?? {}) });
            } catch {
              // ignore when not allowed
            }
          },
          remove(name: string, options?: Record<string, unknown>) {
            try {
              cookieStore.set({ name, value: "", ...(options ?? {}), maxAge: 0 });
            } catch {
              // ignore when not allowed
            }
          },
        },
      }
    );

    // Simplified approach: decode the JWT token to get user info
    let user = null;
    let authError = null;
    
    if (sessionData && sessionData.access_token) {
      try {
        // Decode JWT token to get user info without making external API call
        const tokenParts = sessionData.access_token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          console.log("Token payload:", payload);
          
          // Check if token is not expired
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp > now) {
            // Create a user object from the token payload
            user = {
              id: payload.sub,
              email: payload.email,
              aud: payload.aud,
              role: payload.role,
              // Add other fields as needed
            };
            console.log("User from token:", user);
          } else {
            authError = { message: "Token expired" };
            console.log("Token expired");
          }
        } else {
          authError = { message: "Invalid token format" };
          console.log("Invalid token format");
        }
      } catch (error) {
        authError = { message: "Failed to decode token" };
        console.log("Failed to decode token:", error);
      }
    } else {
      // Fallback: try with the original supabase client (this might also timeout)
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        user = userData.user;
        authError = userError;
      } catch (error) {
        console.log("Fallback auth also failed:", error);
        authError = { message: "Authentication failed" };
      }
    }
    
    if (authError || !user) {
      console.log("Auth error:", authError);
      console.log("Session data received:", sessionData ? "Yes" : "No");
      console.log("Auth header present:", request.headers.get('Authorization') ? "Yes" : "No");
      return NextResponse.json(
        { 
          error: "Authentication required", 
          details: authError?.message,
          debug: {
            hasSessionData: !!sessionData,
            hasAuthHeader: !!request.headers.get('Authorization'),
            errorCode: authError?.status
          }
        },
        { status: 401 }
      );
    }

    // For now, use a simple validation while we debug the database issue
    const validCodes = ["DEF9977", "ABC1234", "XYZ5678", "PET2024", "NFC0001", "DOG1234", "CAT5678", "FISH999", "BIRD777", "HAMSTER1"];
    
    if (!validCodes.includes(code.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid activation code. Please check and try again." },
        { status: 400 }
      );
    }

    // TODO: Later we'll check database for used codes and mark as used
    // For now, just proceed with the validation

    // Check if user already has pets - use admin client to avoid network issues
    let pets = null;
    try {
      // Use user-level client to enforce RLS policies
      const userSupabase = await getServerSupabaseClient();
      
      const { data } = await userSupabase
        .from("pets")
        .select("id")
        .eq("owner_user_id", user.id)
        .limit(1);
      pets = data;
      console.log("Found pets:", pets?.length || 0);
    } catch (error) {
      console.log("Error checking pets:", error);
      // If we can't check pets, assume no pets (safer to send to setup)
      pets = [];
    }

    const hasPets = pets && pets.length > 0;

    return createSuccessResponse({
      hasPets,
      redirectTo: hasPets ? "/dashboard/pets" : "/setup"
    }, "Verification code validated successfully");
}

export const POST = withErrorHandler(handleVerifyCode);
