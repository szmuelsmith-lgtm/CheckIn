import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Singleton so auth state is shared across all pages.
let _client: SupabaseClient | null = null;

export function createClient(): SupabaseClient {
  if (_client) return _client;

  // createBrowserClient stores the session in cookies (not localStorage),
  // which allows the Next.js middleware to read and validate the session
  // server-side. Works correctly with HTTPS (Vercel) in both browser and
  // Capacitor WKWebView (server.url mode).
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return _client;
}
