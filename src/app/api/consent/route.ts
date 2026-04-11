// POST /api/consent
// Body: { action: 'list' } → returns active consents
// Body: { action: 'create', target_profile_id, target_role, scope, checkin_id?, expires_at? } → creates consent
// Body: { action: 'revoke', id, revoke_reason? } → revokes a consent

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getActiveConsents, createConsent, revokeConsent } from '@/lib/consent';
import type { ConsentScope, ConsentTargetRole } from '@/types/database';

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles').select('id, role').eq('auth_user_id', user.id).single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (profile.role !== 'athlete') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown> = {};
  try { body = await request.json(); } catch { /* empty body → default to list */ }

  const action = (body.action as string) ?? 'list';

  // LIST
  if (action === 'list') {
    try {
      const consents = await getActiveConsents(profile.id, supabase);
      return NextResponse.json({ consents });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch consents' }, { status: 500 });
    }
  }

  // CREATE
  if (action === 'create') {
    const { target_profile_id, target_role, scope, checkin_id, expires_at } = body as {
      target_profile_id: string;
      target_role: ConsentTargetRole;
      scope: ConsentScope;
      checkin_id?: string;
      expires_at?: string;
    };

    if (!target_profile_id || !target_role || !scope)
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    if (scope !== 'summary' && scope !== 'full')
      return NextResponse.json({ error: 'Invalid scope' }, { status: 400 });
    if (target_role !== 'psychiatrist' && target_role !== 'trusted_adult')
      return NextResponse.json({ error: 'Invalid target_role' }, { status: 400 });

    try {
      const consent = await createConsent(
        { athleteId: profile.id, targetProfileId: target_profile_id, targetRole: target_role, scope, checkinId: checkin_id, expiresAt: expires_at },
        supabase
      );
      await supabase.from('audit_logs').insert({
        actor_profile_id: profile.id, action: 'create_consent',
        target_type: 'consent_log', target_id: consent.id,
        metadata: { target_profile_id, target_role, scope },
      });
      return NextResponse.json({ consent }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to create consent' }, { status: 500 });
    }
  }

  // REVOKE
  if (action === 'revoke') {
    const consentId = body.id as string;
    if (!consentId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { data: consent } = await supabase
      .from('consent_logs').select('id, athlete_id, is_active').eq('id', consentId).single();
    if (!consent) return NextResponse.json({ error: 'Consent not found' }, { status: 404 });
    if (consent.athlete_id !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!consent.is_active) return NextResponse.json({ error: 'Already revoked' }, { status: 409 });

    try {
      await revokeConsent(consentId, body.revoke_reason as string | undefined, supabase);
      await supabase.from('audit_logs').insert({
        actor_profile_id: profile.id, action: 'revoke_consent',
        target_type: 'consent_log', target_id: consentId,
        metadata: { revoke_reason: body.revoke_reason ?? null },
      });
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Failed to revoke consent' }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
