export type UserRole = "athlete" | "coach" | "support" | "admin" | "psychiatrist" | "trusted_adult";
export type CheckinMode = "weekly" | "screening";
export type Pillar = "emotional" | "resilience" | "recovery" | "support";
export type ConsentScope = "summary" | "full";
export type ConsentTargetRole = "psychiatrist" | "trusted_adult";

export interface PillarScores {
  emotional: number;
  resilience: number;
  recovery: number;
  support: number;
}

export interface Question {
  id: string;
  pillar: Pillar;
  text: string;
  sub_text: string | null;
  low_label: string;
  high_label: string;
  min_val: number;
  max_val: number;
  modes: CheckinMode[];
  active: boolean;
  created_at: string;
}

export interface ConsentLog {
  id: string;
  athlete_id: string;
  checkin_id: string | null;
  target_profile_id: string;
  target_role: ConsentTargetRole;
  scope: ConsentScope;
  is_active: boolean;
  expires_at: string | null;
  granted_at: string;
  revoked_at: string | null;
  revoke_reason: string | null;
}

export interface AccessLog {
  id: string;
  viewer_profile_id: string;
  athlete_id: string;
  checkin_id: string | null;
  consent_log_id: string | null;
  access_type: string;
  accessed_at: string;
  metadata: Record<string, unknown>;
}

export interface QuestionUsage {
  id: string;
  athlete_id: string;
  question_id: string;
  used_at: string;
  checkin_id: string | null;
}
export type RiskLevel = "green" | "yellow" | "red";
export type AlertSeverity = "yellow" | "red";
export type AlertStatus = "open" | "acknowledged" | "resolved";
export type FollowupStatus = "open" | "in_progress" | "completed";
export type ResourceCategory = "crisis" | "counseling" | "academic" | "wellness" | "other";

export interface Organization {
  id: string;
  name: string;
  type: string;
  reminder_day: number;
  created_at: string;
}

export interface Team {
  id: string;
  organization_id: string;
  name: string;
  sport: string;
  created_at: string;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  organization_id: string | null;
  team_id: string | null;
  onboarded: boolean;
  created_at: string;
}

export interface AthletePreferences {
  id: string;
  athlete_id: string;
  wants_faith_support: boolean;
  wants_family_checkins: boolean;
  wants_peer_support: boolean;
  opt_out_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface Checkin {
  id: string;
  athlete_id: string;
  team_id: string | null;
  mode: CheckinMode;
  is_private: boolean;
  emotional_score: number | null;
  resilience_score: number | null;
  recovery_score: number | null;
  support_score: number | null;
  question_ids: string[];
  responses: Record<string, number>;
  notes_private: string | null;
  completed_at: string;
  created_at: string;
}

export interface Journal {
  id: string;
  athlete_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface Alert {
  id: string;
  athlete_id: string;
  checkin_id: string;
  severity: AlertSeverity;
  trigger_type: string;
  status: AlertStatus;
  assigned_to_profile_id: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Followup {
  id: string;
  athlete_id: string;
  alert_id: string;
  assigned_to_profile_id: string | null;
  assigned_by_profile_id: string | null;
  reason: string;
  status: FollowupStatus;
  due_date: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Resource {
  id: string;
  organization_id: string | null;
  title: string;
  description: string;
  category: ResourceCategory;
  url: string;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_profile_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface InviteCode {
  id: string;
  organization_id: string;
  team_id: string | null;
  code: string;
  role: UserRole;
  created_by: string | null;
  uses_remaining: number | null;
  expires_at: string | null;
  created_at: string;
}
