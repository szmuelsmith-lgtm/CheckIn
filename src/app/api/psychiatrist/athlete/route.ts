// POST /api/psychiatrist/athlete  body: { id: athleteId }
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { checkConsent } from '@/lib/consent';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('auth_user_id', user.id).single();

  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.role !== 'psychiatrist' && profile.role !== 'trusted_adult')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let athleteId: string | null = null;
  try { const b = await request.json(); athleteId = b.id ?? null; } catch { /* no body */ }
  if (!athleteId) return NextResponse.json({ error: 'Missing id in body' }, { status: 400 });

  // Check active consent
  const scope = await checkConsent(athleteId, profile.id, supabase);
  if (!scope) return NextResponse.json({ error: 'No active consent from this athlete' }, { status: 403 });

  // Fetch athlete profile
  const { data: athleteProfile } = await supabase
    .from('profiles').select('id, full_name, email').eq('id', athleteId).single();
  if (!athleteProfile) return NextResponse.json({ error: 'Athlete not found' }, { status: 404 });

  // Fetch check-ins based on scope
  const selectCols = scope === 'full'
    ? '*'
    : 'id, athlete_id, team_id, mode, emotional_score, resilience_score, recovery_score, support_score, completed_at';

  const { data: checkins, error: checkinsError } = await supabase
    .from('checkins')
    .select(selectCols)
    .eq('athlete_id', athleteId)
    .order('completed_at', { ascending: false });

  if (checkinsError) return NextResponse.json({ error: 'Failed to fetch checkins' }, { status: 500 });

  // Log access
  await supabase.from('access_logs').insert({
    viewer_profile_id: profile.id,
    athlete_id: athleteId,
    access_type: scope === 'summary' ? 'view_summary' : 'view_full',
    metadata: { scope },
  });

  // Get the granted_at date for the consent
  const { data: consentData } = await supabase
    .from('consent_logs')
    .select('granted_at')
    .eq('athlete_id', athleteId)
    .eq('target_profile_id', profile.id)
    .eq('is_active', true)
    .order('granted_at', { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    athlete: athleteProfile,
    athlete_name: athleteProfile.full_name,
    checkins: checkins ?? [],
    scope,
    granted_at: consentData?.granted_at ?? null,
  });
}
