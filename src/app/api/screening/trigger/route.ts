import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface TriggerBody {
  org_id?: string;
  team_id?: string;
  message?: string;
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();

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

  // Determine target org: use body.org_id if provided, else fall back to admin's own org
  const targetOrgId = body.org_id ?? profile.organization_id;

  if (!targetOrgId) {
    return NextResponse.json(
      { error: 'No org_id provided and admin has no organization_id on their profile' },
      { status: 400 }
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
