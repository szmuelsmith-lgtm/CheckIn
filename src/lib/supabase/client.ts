// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton — every createClient() call in the same session returns the same
// instance, so auth state is shared across all pages without re-reading storage.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any> | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createClient(): SupabaseClient<any> {
  if (_client) return _client;

  _client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage instead of cookies — cookies are unreliable in
        // Capacitor's capacitor:// WebView scheme between navigations.
        persistSession: true,
        storageKey: "checkin-auth-token",
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    }
  );

  return _client;
}
