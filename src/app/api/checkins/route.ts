import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computePillarScores, evaluateSupportTrigger } from '@/lib/pillar-scoring';

interface CheckinBody {
  mode: 'weekly' | 'screening';
  responses: Record<string, number>;
  notes?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile and verify athlete role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, team_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'athlete') {
    return NextResponse.json({ error: 'Forbidden: athletes only' }, { status: 403 });
  }

  // Parse and validate body
  let body: CheckinBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.mode || (body.mode !== 'weekly' && body.mode !== 'screening')) {
    return NextResponse.json({ error: 'Invalid or missing mode' }, { status: 400 });
  }

  if (!body.responses || typeof body.responses !== 'object' || Object.keys(body.responses).length === 0) {
    return NextResponse.json({ error: 'Invalid or missing responses' }, { status: 400 });
  }

  const questionIds = Object.keys(body.responses);

  // Fetch the referenced questions from DB
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .in('id', questionIds);

  if (questionsError || !questions) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Compute pillar scores
  const pillarScores = computePillarScores(body.responses, questions);
  const triggerSupport = evaluateSupportTrigger(pillarScores);

  // Insert checkin record
  const { data: checkin, error: checkinError } = await supabase
    .from('checkins')
    .insert({
      athlete_id:        profile.id,
      team_id:           profile.team_id,
      mode:              body.mode,
      is_private:        true,
      emotional_score:   pillarScores.emotional,
      resilience_score:  pillarScores.resilience,
      recovery_score:    pillarScores.recovery,
      support_score:     pillarScores.support,
      question_ids:      questionIds,
      responses:         body.responses,
      notes_private:     body.notes ?? null,
    })
    .select('id')
    .single();

  if (checkinError || !checkin) {
    return NextResponse.json({ error: 'Failed to create checkin' }, { status: 500 });
  }

  // Insert question_usage rows
  const usageRows = questionIds.map(qid => ({
    athlete_id:  profile.id,
    question_id: qid,
    checkin_id:  checkin.id,
    used_at:     new Date().toISOString(),
  }));

  const { error: usageError } = await supabase
    .from('question_usage')
    .insert(usageRows);

  if (usageError) {
    // Non-fatal: log but don't fail the request
    console.error('Failed to insert question_usage:', usageError);
  }

  // Insert audit log
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      actor_profile_id: profile.id,
      action:           'checkin_submitted',
      target_type:      'checkin',
      target_id:        checkin.id,
      metadata:         { mode: body.mode },
    });

  if (auditError) {
    console.error('Failed to insert audit_log:', auditError);
  }

  return NextResponse.json(
    { checkin_id: checkin.id, triggerSupport, pillarScores },
    { status: 201 }
  );
}
