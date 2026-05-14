import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export function createServerSupabaseClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignored in Server Components where cookies can't be set
          }
        },
      },
    }
  );
}

/**
 * Creates a Supabase client that works for both web (cookie-based auth) and
 * the Capacitor bundled app (Bearer token in Authorization header).
 *
 * In the bundled app the WebView origin is capacitor://localhost, so cookies
 * from the main domain aren't present. Instead apiFetch() forwards the
 * Supabase access token as `Authorization: Bearer <token>`.
 */
export function createRequestSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const accessToken = authHeader.slice(7);
    // Use a plain client initialized with the user's access token.
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${accessToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );
  }
  // Fallback: standard cookie-based auth (web / Vercel deployment).
  return createServerSupabaseClient();
}

// Service role client — bypasses RLS. Only use server-side after auth is verified.
export function createServiceSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
