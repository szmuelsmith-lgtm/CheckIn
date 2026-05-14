/**
 * Returns an absolute URL for API routes.
 *
 * - Web / dev:  returns the path as-is (e.g. "/api/checkins")
 *   → relative URL works because the browser and server share the same origin.
 *
 * - Capacitor app build:  prefixes with the production server URL
 *   (e.g. "https://check-in-gilt.vercel.app/api/checkins")
 *   → the bundled UI lives at capacitor://localhost, so API calls need
 *     an explicit origin to reach the Next.js server.
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? '';
  return `${base}${path}`;
}

/**
 * Returns fetch options with the Supabase access token in the Authorization
 * header so API routes can authenticate in the Capacitor bundled-app context
 * (where auth lives in localStorage rather than cookies).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> ?? {}),
  };

  // Inject the access token when running as a bundled app.
  if (process.env.NEXT_PUBLIC_API_BASE) {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch { /* non-fatal */ }
  }

  return fetch(apiUrl(path), { ...init, headers, credentials: 'include' });
}
