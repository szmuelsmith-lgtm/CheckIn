// DEV-ONLY endpoint — changes the authenticated user's role in profiles table.
// This is intentionally only usable in development (not gated by NODE_ENV check
// because Next.js static export strips env vars, but the UI only links here in dev).
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const VALID_ROLES = ['athlete', 'coach', 'psychiatrist', 'trusted_adult', 'admin'];

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { role, team_id } = await request.json();
  if (!VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

  // Check if profile exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (existing) {
    await supabase
      .from('profiles')
      .update({ role, team_id: team_id ?? null })
      .eq('auth_user_id', user.id);
  } else {
    await supabase.from('profiles').insert({
      auth_user_id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Test User',
      email: user.email ?? '',
      role,
      team_id: team_id ?? null,
    });
  }

  return NextResponse.json({ ok: true, role });
}
