import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scoreToPillarLevel } from '@/lib/pillar-scoring';
import type { PillarLevel } from '@/lib/pillar-scoring';
import type { Pillar } from '@/types/database';

type PillarDistribution = Record<PillarLevel, number>;
type DistributionResult = Record<Pillar, PillarDistribution>;

interface PillarTrend {
  this_week_avg:     number;
  last_week_avg:     number;
  month_avg:         number;
  weekly_change_pct: number;
  direction:         'up' | 'down' | 'flat';
}

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

function colAvg(rows: Record<string, unknown>[], col: string): number {
  const vals = rows
    .map(c => c[col] as number)
    .filter(s => typeof s === 'number' && !isNaN(s));
  return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
}

function changePct(cur: number, prev: number): number {
  if (!prev) return 0;
  return parseFloat((((cur - prev) / prev) * 100).toFixed(1));
}

// POST /api/coach/aggregate  (no body needed)
export async function POST() {
  const supabase = createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
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

  const { data: athletes, error: athletesError } = await supabase
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
  const now          = Date.now();
  const cutoff28     = new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString();
  const thisWeekFrom = now -  7 * 24 * 60 * 60 * 1000;
  const lastWeekFrom = now - 14 * 24 * 60 * 60 * 1000;

  // Fetch weekly checkins from the past 28 days for trend comparison
  const { data: allCheckins, error: checkinsError } = await supabase
    .from('checkins')
    .select('athlete_id, emotional_score, resilience_score, recovery_score, support_score, completed_at')
    .in('athlete_id', athleteIds)
    .eq('mode', 'weekly')
    .gte('completed_at', cutoff28)
    .order('completed_at', { ascending: false });

  if (checkinsError) {
    return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });
  }

  const rows = (allCheckins ?? []) as Record<string, unknown>[];

  // Split into time windows
  const thisWeekRows = rows.filter(c => new Date(c.completed_at as string).getTime() >= thisWeekFrom);
  const lastWeekRows = rows.filter(c => {
    const t = new Date(c.completed_at as string).getTime();
    return t >= lastWeekFrom && t < thisWeekFrom;
  });

  // One row per athlete (most recent) for current snapshot — within last 14 days
  const seenAthletes = new Set<string>();
  const latestCheckins: typeof rows = [];
  for (const c of rows) {
    const t = new Date(c.completed_at as string).getTime();
    if (t >= lastWeekFrom && !seenAthletes.has(c.athlete_id as string)) {
      seenAthletes.add(c.athlete_id as string);
      latestCheckins.push(c);
    }
  }

  const checkinsThisWeek = new Set(thisWeekRows.map(c => c.athlete_id)).size;
  const checkinRate = athleteCount > 0
    ? parseFloat(((checkinsThisWeek / athleteCount) * 100).toFixed(1))
    : 0;

  const pillarAverages: Record<Pillar, number> = { emotional: 0, resilience: 0, recovery: 0, support: 0 };
  const pillarTrends: Record<Pillar, PillarTrend> = {} as Record<Pillar, PillarTrend>;
  const distribution: DistributionResult = {
    emotional:  emptyDistribution(),
    resilience: emptyDistribution(),
    recovery:   emptyDistribution(),
    support:    emptyDistribution(),
  };

  for (const pillar of PILLARS) {
    const col    = PILLAR_SCORE_COLUMNS[pillar];
    const twAvg  = colAvg(thisWeekRows,  col);
    const lwAvg  = colAvg(lastWeekRows,  col);
    const moAvg  = colAvg(rows,          col);
    const curAvg = colAvg(latestCheckins, col);
    const wkPct  = changePct(twAvg, lwAvg);

    pillarAverages[pillar] = curAvg || twAvg || moAvg || 0;
    pillarTrends[pillar]   = {
      this_week_avg:     twAvg,
      last_week_avg:     lwAvg,
      month_avg:         moAvg,
      weekly_change_pct: wkPct,
      direction:         wkPct > 3 ? 'up' : wkPct < -3 ? 'down' : 'flat',
    };

    const scores = latestCheckins
      .map(c => c[col] as number)
      .filter(s => typeof s === 'number' && !isNaN(s));
    for (const score of scores) {
      distribution[pillar][scoreToPillarLevel(score)]++;
    }
  }

  // Log access (non-critical — fire-and-forget, ignore errors)
  void Promise.resolve(
    supabase.from('access_logs').insert({
      viewer_profile_id: profile.id,
      checkin_id:        null,
      access_type:       'coach_aggregate',
      metadata:          { team_id: profile.team_id, athlete_count: athleteCount },
    })
  ).catch(() => {});

  return NextResponse.json({
    checkin_rate:       checkinRate,
    pillar_averages:    pillarAverages,
    pillar_trends:      pillarTrends,
    distribution,
    athlete_count:      athleteCount,
    checkins_this_week: checkinsThisWeek,
  });
}
