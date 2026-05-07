import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';
import { computePillarScores, evaluateSupportTrigger, evaluateRiskLevel } from '@/lib/pillar-scoring';
import { sendRedAlertEmail } from '@/lib/email';

interface CheckinBody {
  mode: 'weekly' | 'screening';
  responses: Record<string, number>;
  notes?: string;
  wants_followup?: boolean;
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
    .select('id, role, team_id, organization_id')
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
    console.error('checkin 400: empty/missing responses. body:', JSON.stringify(body));
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

  // Compute pillar scores and risk level
  const pillarScores   = computePillarScores(body.responses, questions);
  const wantsFollowup  = body.wants_followup === true;
  const triggerSupport = evaluateSupportTrigger(pillarScores);
  const riskLevel      = evaluateRiskLevel(pillarScores, wantsFollowup);

  // Insert checkin record — use generated_id so we don't need a read-back
  const generatedId = crypto.randomUUID();
  const { error: checkinError } = await supabase
    .from('checkins')
    .insert({
      id:                generatedId,
      athlete_id:        profile.id,
      team_id:           profile.team_id,
      mode:              body.mode,
      is_private:        true,
      emotional_score:   pillarScores.emotional,
      resilience_score:  pillarScores.resilience,
      recovery_score:    pillarScores.recovery,
      support_score:     pillarScores.support,
      wants_followup:    wantsFollowup,
      risk_level:        riskLevel,
      question_ids:      questionIds,
      responses:         body.responses,
      notes_private:     body.notes ?? null,
    });

  if (checkinError) {
    console.error('checkin insert error:', JSON.stringify(checkinError));
    return NextResponse.json({ error: 'Failed to create checkin', detail: checkinError?.message }, { status: 500 });
  }
  const checkin = { id: generatedId };

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

  // Auto-create alert for yellow/red risk levels — use service role to bypass RLS
  if (riskLevel === 'yellow' || riskLevel === 'red') {
    const serviceClient = createServiceSupabaseClient();
    const triggerType   = wantsFollowup ? 'wants_followup' : 'risk_score';

    const { error: alertError } = await serviceClient
      .from('alerts')
      .insert({
        athlete_id:   profile.id,
        checkin_id:   checkin.id,
        severity:     riskLevel,
        trigger_type: triggerType,
        status:       'open',
      });

    if (alertError) {
      console.error('Failed to insert alert:', alertError);
    }

    // Notify support staff for red-level alerts
    if (riskLevel === 'red' && profile.organization_id) {
      try {
        const { data: teamData } = await serviceClient
          .from('teams')
          .select('name')
          .eq('id', profile.team_id)
          .single();

        const { data: staffList } = await serviceClient
          .from('profiles')
          .select('email')
          .eq('organization_id', profile.organization_id)
          .in('role', ['support', 'admin', 'psychiatrist']);

        const teamName = teamData?.name ?? 'your program';
        if (staffList && staffList.length > 0) {
          await Promise.all(
            staffList.map(staff =>
              sendRedAlertEmail({ to: staff.email, teamName }).catch(err =>
                console.error('Alert email failed for', staff.email, err)
              )
            )
          );
        }
      } catch (err) {
        console.error('Failed to send alert notifications:', err);
      }
    }
  }

  return NextResponse.json(
    { checkin_id: checkin.id, triggerSupport, riskLevel, pillarScores },
    { status: 201 }
  );
}
