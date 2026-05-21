import { NextRequest, NextResponse } from 'next/server';
import { createRequestSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase/server';

// DELETE /api/account/delete
// Permanently deletes the authenticated user's account and all associated data.
// Required for Apple App Store compliance (guideline 5.1.1).
export async function DELETE(request: NextRequest) {
  const supabase = createRequestSupabaseClient(request);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const service = createServiceSupabaseClient();

  // Audit the deletion BEFORE destroying data so the record exists even if a later
  // step fails. actor_profile_id will be anonymised to null by the UPDATE below, but
  // the event itself remains in the log for FERPA compliance.
  await service.from('audit_logs').insert({
    actor_profile_id: profile.id,
    action:           'account_deleted',
    target_type:      'profile',
    target_id:        profile.id,
    metadata:         { deletion_reason: 'user_requested' },
  });

  // Delete user-generated content in dependency order.
  // audit_logs and access_logs are retained (anonymized) for compliance.
  await service.from('question_usage').delete().eq('athlete_id', profile.id);
  await service.from('followups').delete().eq('athlete_id', profile.id);
  await service.from('alerts').delete().eq('athlete_id', profile.id);
  await service.from('checkins').delete().eq('athlete_id', profile.id);
  await service.from('journals').delete().eq('athlete_id', profile.id);
  await service.from('profiles').delete().eq('id', profile.id);

  // Anonymize audit trail — replace profile_id references with a null sentinel
  // so logs remain for compliance without linking to the deleted identity
  await service
    .from('audit_logs')
    .update({ actor_profile_id: null })
    .eq('actor_profile_id', profile.id);

  await service
    .from('access_logs')
    .update({ viewer_profile_id: null })
    .eq('viewer_profile_id', profile.id);

  // Delete the auth user last — this invalidates all sessions
  const { error: deleteAuthError } = await service.auth.admin.deleteUser(user.id);
  if (deleteAuthError) {
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
