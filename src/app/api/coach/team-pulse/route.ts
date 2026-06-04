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

function avg(arr: number[]): number | null {
  if (arr.length < 5) return null; // k-anonymity
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
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

  // Fetch team athletes (auth'd client — coach has RLS access to profiles in own org)
  const { data: athletes, error: athletesError } = await authed
    .from('profiles')
    .select('id')
    .eq('team_id', profile.team_id)
    .eq('role', 'athlete')
    .eq('organization_id', profile.organization_id ?? '');

  if (athletesError) {
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }

  const athleteCount = (athletes ?? []).length;

  if (athleteCount < 5) {
    return NextResponse.json({ insufficient_data: true, athlete_count: athleteCount });
  }

  const athleteIds  = athletes!.map(a => a.id);
  const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000).toISOString();

  // Service role: coaches have no direct RLS SELECT on checkins — all access goes
  // through this server route which returns only aggregated weekly buckets.
  const service = createServiceSupabaseClient();
  const { data: checkins, error: checkinsError } = await service
    .from('checkins')
    .select('emotional_score, resilience_score, recovery_score, support_score, completed_at')
    .in('athlete_id', athleteIds)
    .eq('mode', 'weekly')
    .gte('completed_at', eightWeeksAgo)
    .order('completed_at', { ascending: true });

  // Note: athlete_id is intentionally NOT selected — response must never expose
  // which specific athlete submitted which score.

  if (checkinsError) {
    return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });
  }

  if (!checkins || checkins.length === 0) {
    return NextResponse.json({ weeks: [], total_athletes: athleteCount });
  }

  // Bucket by ISO week (Monday start).
  // Use only the LATEST check-in per athlete per week so one athlete
  // submitting multiple times doesn't inflate the participation rate above 100%.
  type Bucket = { emotional: number[]; resilience: number[]; recovery: number[]; support: number[]; athleteIds: Set<string>; };
  const weekMap = new Map<string, Bucket>();
  // Track latest check-in per (athlete, week) to deduplicate
  const latestPerAthleteWeek = new Map<string, typeof checkins[0]>();

  for (const c of checkins) {
    const date  = new Date(c.completed_at);
    const day   = date.getDay();
    const diff  = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon   = new Date(date);
    mon.setDate(diff);
    const weekKey = mon.toISOString().split('T')[0];
    const dedupeKey = `${c.athlete_id}::${weekKey}`;
    const existing = latestPerAthleteWeek.get(dedupeKey);
    if (!existing || c.completed_at > existing.completed_at) {
      latestPerAthleteWeek.set(dedupeKey, c);
    }
  }

  for (const [dedupeKey, c] of latestPerAthleteWeek) {
    const weekKey = dedupeKey.split('::')[1];
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { emotional: [], resilience: [], recovery: [], support: [], athleteIds: new Set() });
    }
    const b = weekMap.get(weekKey)!;
    b.athleteIds.add(c.athlete_id);
    if (c.emotional_score  != null) b.emotional.push(c.emotional_score);
    if (c.resilience_score != null) b.resilience.push(c.resilience_score);
    if (c.recovery_score   != null) b.recovery.push(c.recovery_score);
    if (c.support_score    != null) b.support.push(c.support_score);
  }

  const weeks: WeeklyPulse[] = Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, b]) => {
      const d = new Date(key);
      return {
        weekKey:      key,
        weekLabel:    `${d.getMonth() + 1}/${d.getDate()}`,
        emotional:    avg(b.emotional),
        resilience:   avg(b.resilience),
        recovery:     avg(b.recovery),
        support:      avg(b.support),
        checkinCount: b.athleteIds.size,
        totalAthletes: athleteCount,
      };
    });

  return NextResponse.json({ weeks, total_athletes: athleteCount });
}
