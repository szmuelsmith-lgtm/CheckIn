import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { selectQuestionsForSession } from '@/lib/question-engine';
import type { CheckinMode } from '@/types/database';

// POST /api/questions  body: { mode: 'weekly' | 'screening' }
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('id, role').eq('auth_user_id', user.id).single();
  if (profileError || !profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.role !== 'athlete') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let modeParam = 'weekly';
  try { const b = await request.json(); modeParam = b.mode ?? 'weekly'; } catch { /* default to weekly */ }
  if (modeParam !== 'weekly' && modeParam !== 'screening') {
    return NextResponse.json({ error: 'Invalid mode. Use "weekly" or "screening"' }, { status: 400 });
  }
  const mode: CheckinMode = modeParam;

  // Fetch all active questions
  const { data: allQuestions, error: questionsError, count } = await supabase
    .from('questions')
    .select('*', { count: 'exact' })
    .eq('active', true);

  if (questionsError) {
    console.error('questions fetch error:', JSON.stringify(questionsError));
    return NextResponse.json({ error: 'Failed to fetch questions', detail: questionsError.message }, { status: 500 });
  }

  // Also try without active filter to detect if table is simply empty vs RLS blocking
  const { count: totalCount, error: totalError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true });
  console.log('questions table total count (no filter):', totalCount, 'error:', JSON.stringify(totalError));
  console.log('active questions count:', count);

  // Fetch question_usage for this athlete in the past 14 days (non-fatal if table missing)
  const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUsage } = await supabase
    .from('question_usage')
    .select('*')
    .eq('athlete_id', profile.id)
    .gte('used_at', cutoffDate);

  const aq = allQuestions ?? [];
  console.log('allQuestions count:', aq.length, 'sample:', JSON.stringify(aq[0]));

  let questions = selectQuestionsForSession(
    profile.id,
    mode,
    aq,
    recentUsage ?? []
  );

  // Fallback: if engine returned nothing but we have questions in DB,
  // pick 2 per pillar directly (avoids any type-mismatch in engine filters)
  if (questions.length === 0 && aq.length > 0) {
    const PILLARS = ['emotional', 'resilience', 'recovery', 'support'] as const;
    const perPillar = mode === 'weekly' ? 2 : 4;
    const fallbackQuestions: typeof aq = [];
    for (const pillar of PILLARS) {
      const pillarQs = aq.filter(q => String(q.pillar) === pillar);
      fallbackQuestions.push(...pillarQs.slice(0, perPillar));
    }
    questions = fallbackQuestions;
    console.log('used fallback selection, count:', questions.length);
  }

  console.log('selected questions count:', questions.length);
  return NextResponse.json({ questions });
}
