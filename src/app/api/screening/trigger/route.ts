import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabaseClient } from '@/lib/supabase/server';

interface TriggerBody {
  org_id?: string;
  team_id?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createRequestSupabaseClient(request);

  // Verify authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch profile and verify admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, organization_id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: admins only' }, { status: 403 });
  }

  // Parse and validate body
  let body: TriggerBody = {};
  try {
    const text = await request.text();
    if (text) {
      body = JSON.parse(text);
    }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Always use the admin's own org — never trust body.org_id to prevent cross-org activation
  const targetOrgId = profile.organization_id;

  if (!targetOrgId) {
    return NextResponse.json(
      { error: 'Admin profile has no organization_id — cannot scope screening activation' },
      { status: 400 }
    );
  }

  // If caller explicitly passed org_id, make sure it matches (catches misconfigured clients)
  if (body.org_id && body.org_id !== targetOrgId) {
    return NextResponse.json(
      { error: 'Forbidden: org_id does not match your organization' },
      { status: 403 }
    );
  }

  // Activate screening window for the organization
  const { error: updateError } = await supabase
    .from('organizations')
    .update({ screening_active: true })
    .eq('id', targetOrgId);

  if (updateError) {
    console.error('Failed to activate screening:', updateError);
    return NextResponse.json({ error: 'Failed to activate screening window' }, { status: 500 });
  }

  // Insert audit log
  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      actor_profile_id: profile.id,
      action:           'screening_triggered',
      target_type:      'organization',
      target_id:        targetOrgId,
      metadata:         {
        org_id:  targetOrgId,
        team_id: body.team_id ?? null,
        message: body.message ?? null,
      },
    });

  if (auditError) {
    console.error('Failed to insert audit_log:', auditError);
  }

  return NextResponse.json({ success: true });
}
