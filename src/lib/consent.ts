import type { SupabaseClient } from '@supabase/supabase-js';
import type { ConsentLog, ConsentScope, ConsentTargetRole } from '@/types/database';

export async function getActiveConsents(
  athleteId: string,
  supabase: SupabaseClient
): Promise<ConsentLog[]> {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('*, target_profile:target_profile_id(id, full_name, email, role)')
    .eq('athlete_id', athleteId)
    .eq('is_active', true)
    .order('granted_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createConsent(
  params: {
    athleteId: string;
    targetProfileId: string;
    targetRole: ConsentTargetRole;
    scope: ConsentScope;
    checkinId?: string;
    expiresAt?: string;
  },
  supabase: SupabaseClient
): Promise<ConsentLog> {
  const { data, error } = await supabase
    .from('consent_logs')
    .insert({
      athlete_id:        params.athleteId,
      target_profile_id: params.targetProfileId,
      target_role:       params.targetRole,
      scope:             params.scope,
      checkin_id:        params.checkinId ?? null,
      expires_at:        params.expiresAt ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function revokeConsent(
  consentId: string,
  reason: string | undefined,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('consent_logs')
    .update({
      is_active:    false,
      revoked_at:   new Date().toISOString(),
      revoke_reason: reason ?? null,
    })
    .eq('id', consentId);

  if (error) throw error;
}

export async function checkConsent(
  athleteId: string,
  viewerProfileId: string,
  supabase: SupabaseClient
): Promise<ConsentScope | null> {
  const { data, error } = await supabase
    .from('consent_logs')
    .select('scope')
    .eq('athlete_id', athleteId)
    .eq('target_profile_id', viewerProfileId)
    .eq('is_active', true)
    .order('scope', { ascending: true }) // 'full' < 'summary' alphabetically, so full comes first
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].scope as ConsentScope;
}
