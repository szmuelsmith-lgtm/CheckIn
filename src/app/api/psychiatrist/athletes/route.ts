import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// POST /api/psychiatrist/athletes  (no body needed)
export async function POST() {
  const supabase = createServerSupabaseClient();

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile and verify psychiatrist role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'psychiatrist') {
    return NextResponse.json({ error: 'Forbidden: psychiatrists only' }, { status: 403 });
  }

  // Fetch active consent grants where this psychiatrist is the target
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

  // Shape the response: basic athlete info + consent metadata
  const athletes = (consents ?? []).map(c => {
    const ap = c.athlete_profile as unknown as { id: string; full_name: string; email: string } | null;
    return {
      athlete_id:  c.athlete_id,
      full_name:   ap?.full_name ?? null,
      email:       ap?.email ?? null,
      consent_id:  c.id,
      scope:       c.scope,
      granted_at:  c.granted_at,
      expires_at:  c.expires_at,
    };
  });

  return NextResponse.json({ athletes });
}
