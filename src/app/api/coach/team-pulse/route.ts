/**
 * POST /api/coach/team-pulse
 *
 * Returns 8 weeks of aggregated team pillar averages for the coach's team.
 * Uses service role to read checkins (coaches have no direct RLS on checkins).
 * Individual rows are never returned — only pre-aggregated weekly buckets.
 *
 * Privacy guarantees:
 *   - Requires ≥5 athletes with data in a week bucket before returning averages
 *   - Buckets with <5 responses return null for all pillars (k-anonymity)
 *   - athlete_id never appears in the response
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';

interface WeeklyPulse {
  weekLabel:    string;
  weekKey:      string;
  emotional:    number | null;
  resilience:   number | null;
  recovery:     number | null;
  support:      number | null;
  checkinCount: number;
  totalAthletes: number;
}

export async function POST(request: NextRequest) {
  const authed = createRequestSupabaseClient(request);

  const { data: { user }, error: authError } = await authed.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await authed
    .from('profiles')
    .select('id, role, team_id, organization_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden: coaches only' }, { status: 403 });
  }

  if (!profile.team_id) {
    return NextResponse.json({ insufficient_data: true, athlete_count: 0, no_team: true });
  }

  // Count team athletes cheaply (head request — pulls no rows, scales to any org size).
  const { count: athleteCountRaw, error: countError } = await authed
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('team_id', profile.team_id)
    .eq('role', 'athlete')
    .eq('organization_id', profile.organization_id ?? '');

  if (countError) {
    return NextResponse.json({ error: 'Failed to count athletes' }, { status: 500 });
  }
  const athleteCount = athleteCountRaw ?? 0;

  if (athleteCount < 5) {
    return NextResponse.json({ insufficient_data: true, athlete_count: athleteCount });
  }

  // All aggregation happens in Postgres via coach_team_pulse(): dedup to the
  // latest check-in per athlete per week, average per pillar, and apply
  // k-anonymity (NULL pillars when <5 athletes). No rows are pulled into the
  // app, so this is correct and fast for an org of any size.
  const service = createServiceSupabaseClient();
  const { data: rows, error: rpcError } = await service.rpc('coach_team_pulse', {
    p_team_id: profile.team_id,
    p_weeks:   8,
  });

  if (rpcError) {
    return NextResponse.json({ error: 'Failed to aggregate team pulse' }, { status: 500 });
  }

  type PulseRow = {
    week_key: string; emotional: number | null; resilience: number | null;
    recovery: number | null; support: number | null;
    checkin_count: number; total_athletes: number;
  };

  const weeks: WeeklyPulse[] = ((rows ?? []) as PulseRow[]).map(r => {
    // week_key is 'YYYY-MM-DD' (Monday). Parse parts directly to avoid TZ drift.
    const [, m, d] = r.week_key.split('-');
    return {
      weekKey:       r.week_key,
      weekLabel:     `${Number(m)}/${Number(d)}`,
      emotional:     r.emotional,
      resilience:    r.resilience,
      recovery:      r.recovery,
      support:       r.support,
      checkinCount:  Number(r.checkin_count),
      totalAthletes: athleteCount,
    };
  });

  return NextResponse.json({ weeks, total_athletes: athleteCount });
}
