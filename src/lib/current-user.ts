import type { SupabaseClient } from "@supabase/supabase-js";

// Shared, cached lookup of the signed-in user's OWN profile.
//
// Why: nearly every dashboard page (and the layout) independently called
// auth.getUser() (a network round-trip) followed by a profiles lookup keyed on
// auth_user_id. On one dashboard load that meant 4+ duplicate getUser calls and
// 4+ duplicate profile fetches. This collapses them to a single fetch per
// session:
//   • getSession() reads local storage (no network round-trip) vs getUser().
//   • The resulting profile is cached per user id for the SPA session.
//   • Concurrent callers (layout + page mounting together) share one in-flight
//     request instead of racing duplicate fetches.
//
// Authorization is unaffected — every data query is still validated by RLS and
// the auth middleware. This only deduplicates the "who am I" lookup.

export interface MyProfile {
  id: string;
  auth_user_id: string;
  full_name: string;
  role: string;
  organization_id: string | null;
  team_id: string | null;
  onboarded: boolean | null;
  email: string | null;
}

let cache: { userId: string; profile: MyProfile } | null = null;
let inflight: Promise<{ userId: string | null; profile: MyProfile | null }> | null = null;

const FIELDS = "id, auth_user_id, full_name, role, organization_id, team_id, onboarded, email";

export async function getMyProfile(
  supabase: SupabaseClient
): Promise<{ userId: string | null; profile: MyProfile | null }> {
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return { userId: null, profile: null };

  if (cache && cache.userId === user.id) {
    return { userId: user.id, profile: cache.profile };
  }
  if (inflight) return inflight;

  inflight = (async () => {
    const { data } = await supabase
      .from("profiles")
      .select(FIELDS)
      .eq("auth_user_id", user.id)
      .single();
    const profile = (data as MyProfile | null) ?? null;
    if (profile) cache = { userId: user.id, profile };
    inflight = null;
    return { userId: user.id, profile };
  })();

  return inflight;
}

// Call after the profile changes (e.g. onboarding flip) or on sign-out so the
// next read re-fetches instead of returning stale data.
export function clearMyProfileCache() {
  cache = null;
  inflight = null;
}
