import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scoreToPillarLevel } from '@/lib/pillar-scoring';
import type { PillarLevel } from '@/lib/pillar-scoring';
import type { Pillar } from '@/types/database';

type PillarDistribution = Record<PillarLevel, number>;
type DistributionResult = Record<Pillar, PillarDistribution>;

const PILLARS: Pillar[] = ['emotional', 'resilience', 'recovery', 'support'];
const PILLAR_SCORE_COLUMNS: Record<Pillar, string> = {
  emotional:  'emotional_score',
  resilience: 'resilience_score',
  recovery:   'recovery_score',
  support:    'support_score',
};

function emptyDistribution(): PillarDistribution {
  return { stable: 0, moderate: 0, elevated: 0, high: 0 };
}

// POST /api/coach/aggregate  (no body needed)
export async function POST() {
  // Use the regular auth client to verify the caller's identity and role
  const authClient = createServerSupabaseClient();

  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await authClient
    .from('profiles')
    .select('id, role, team_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'coach') {
    return NextResponse.json({ error: 'Forbidden: coaches only' }, { status: 403 });
  }

  if (!profile.team_id) {
    return NextResponse.json({ error: 'Coach is not assigned to a team' }, { status: 400 });
  }

  // Use service role client for privileged data access
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch all athlete profile IDs on the coach's team
  const { data: athletes, error: athletesError } = await serviceClient
    .from('profiles')
    .select('id')
    .eq('team_id', profile.team_id)
    .eq('role', 'athlete');

  if (athletesError) {
    return NextResponse.json({ error: 'Failed to fetch athletes' }, { status: 500 });
  }

  const athleteCount = (athletes ?? []).length;

  // Enforce k-anonymity: require at least 5 athletes
  if (athleteCount < 5) {
    return NextResponse.json({ insufficient_data: true, athlete_count: athleteCount });
  }

  const athleteIds = athletes!.map(a => a.id);
  const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch most recent weekly checkin per athlete in the past 14 days
  // We fetch all and then deduplicate to the latest per athlete in JS
  const { data: allCheckins, error: checkinsError } = await serviceClient
    .from('checkins')
    .select('id, athlete_id, emotional_score, resilience_score, recovery_score, support_score, completed_at')
    .in('athlete_id', athleteIds)
    .eq('mode', 'weekly')
    .gte('completed_at', cutoffDate)
    .order('completed_at', { ascending: false });

  if (checkinsError) {
    return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });
  }

  // Deduplicate to one checkin per athlete (the most recent, already sorted desc)
  const seenAthletes = new Set<string>();
  const latestCheckins: typeof allCheckins = [];
  for (const c of (allCheckins ?? [])) {
    if (!seenAthletes.has(c.athlete_id)) {
      seenAthletes.add(c.athlete_id);
      latestCheckins.push(c);
    }
  }

  const checkinsThisWeek = latestCheckins.length;
  const checkinRate = athleteCount > 0
    ? parseFloat(((checkinsThisWeek / athleteCount) * 100).toFixed(1))
    : 0;

  // Calculate pillar averages
  const pillarAverages: Record<Pillar, number> = {
    emotional:  0,
    resilience: 0,
    recovery:   0,
    support:    0,
  };

  const distribution: DistributionResult = {
    emotional:  emptyDistribution(),
    resilience: emptyDistribution(),
    recovery:   emptyDistribution(),
    support:    emptyDistribution(),
  };

  if (latestCheckins.length > 0) {
    for (const pillar of PILLARS) {
      const col = PILLAR_SCORE_COLUMNS[pillar];
      const scores = latestCheckins
        .map(c => (c as Record<string, unknown>)[col] as number)
        .filter(s => typeof s === 'number' && !isNaN(s));

      if (scores.length > 0) {
        pillarAverages[pillar] = parseFloat(
          (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2)
        );
        for (const score of scores) {
          const level = scoreToPillarLevel(score);
          distribution[pillar][level]++;
        }
      }
    }
  }

  // Insert access log
  const { error: accessLogError } = await serviceClient
    .from('access_logs')
    .insert({
      viewer_profile_id: profile.id,
      athlete_id:        null,
      checkin_id:        null,
      access_type:       'coach_aggregate',
      metadata:          { team_id: profile.team_id, athlete_count: athleteCount },
    });

  if (accessLogError) {
    console.error('Failed to insert access_log:', accessLogError);
  }

  return NextResponse.json({
    checkin_rate:     checkinRate,
    pillar_averages:  pillarAverages,
    distribution,
    athlete_count:    athleteCount,
    checkins_this_week: checkinsThisWeek,
  });
}
