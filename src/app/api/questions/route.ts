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
  const { data: allQuestions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('active', true);

  if (questionsError) {
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 });
  }

  // Fetch question_usage for this athlete in the past 14 days
  const cutoffDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentUsage, error: usageError } = await supabase
    .from('question_usage')
    .select('*')
    .eq('athlete_id', profile.id)
    .gte('used_at', cutoffDate);

  if (usageError) {
    return NextResponse.json({ error: 'Failed to fetch question usage' }, { status: 500 });
  }

  const questions = selectQuestionsForSession(
    profile.id,
    mode,
    allQuestions ?? [],
    recentUsage ?? []
  );

  return NextResponse.json({ questions });
}
