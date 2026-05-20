import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabaseClient } from '@/lib/supabase/server';

// POST /api/psychiatrist/athletes  (no body needed)
export async function POST(request: NextRequest) {
  const supabase = createRequestSupabaseClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'psychiatrist') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch active consent grants targeting this user
  const { data: consents, error: consentsError } = await supabase
    .from('consent_logs')
    .select(`
      id,
      athlete_id,
      scope,
      granted_at,
      expires_at,
      athlete_profile:athlete_id (
        id,
        full_name,
        email
      )
    `)
    .eq('target_profile_id', profile.id)
    .eq('is_active', true)
    .order('granted_at', { ascending: false });

  if (consentsError) {
    console.error('Failed to fetch consents:', consentsError);
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }

  if (!consents || consents.length === 0) {
    return NextResponse.json({ athletes: [] });
  }

  // Fetch latest check-in date for each consented athlete.
  // Scope to last 90 days to avoid unbounded full-history scans as athlete count grows.
  const athleteIds = consents.map(c => c.athlete_id);
  const cutoff90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: latestCheckins } = await supabase
    .from('checkins')
    .select('athlete_id, completed_at')
    .in('athlete_id', athleteIds)
    .gte('completed_at', cutoff90)
    .order('completed_at', { ascending: false })
    .limit(athleteIds.length * 10); // at most ~10 checkins per athlete to find the latest

  // Build a map of athlete_id → latest completed_at
  const latestCheckinMap = new Map<string, string>();
  (latestCheckins ?? []).forEach(c => {
    if (!latestCheckinMap.has(c.athlete_id)) {
      latestCheckinMap.set(c.athlete_id, c.completed_at);
    }
  });

  const athletes = consents.map(c => {
    const ap = c.athlete_profile as unknown as { id: string; full_name: string; email: string } | null;
    return {
      athlete_id:      c.athlete_id,
      athlete_name:    ap?.full_name ?? null,
      email:           ap?.email ?? null,
      consent_id:      c.id,
      scope:           c.scope,
      granted_at:      c.granted_at,
      expires_at:      c.expires_at,
      last_checkin_at: latestCheckinMap.get(c.athlete_id) ?? null,
    };
  });

  return NextResponse.json({ athletes });
}
