import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton so auth state is shared across all pages.
let _client: SupabaseClient | null = null;

/**
 * Returns true when running inside a Capacitor WKWebView (native app).
 * Cookies don't work under the capacitor:// protocol, so we use localStorage
 * instead of cookie-based session storage in that context.
 */
function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cap = (window as any).Capacitor;
  return (
    cap?.isNativePlatform?.() === true ||
    cap?.isNative === true ||
    window.location.protocol === "capacitor:"
  );
}

export function createClient(): SupabaseClient {
  if (_client) return _client;

  if (isCapacitorNative()) {
    // In the Capacitor WKWebView the capacitor:// protocol means document.cookie
    // doesn't work. Use the plain supabase-js client which stores the session
    // in localStorage — the server-side middleware is not involved here; auth is
    // done via Bearer token forwarded by apiFetch().
    _client = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storage: typeof window !== "undefined" ? window.localStorage : undefined,
        },
      }
    );
  } else {
    // Web / Vercel: use cookie-based SSR client so the Next.js middleware can
    // read and validate the session server-side.
    _client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return _client;
}
