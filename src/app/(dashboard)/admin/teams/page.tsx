"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Users, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

const T = {
  surface:   "#ffffff",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

interface TeamWithStats {
  id: string;
  name: string;
  sport: string;
  athlete_count: number;
  checkin_rate: number;
  risk_distribution: { green: number; yellow: number; red: number };
  invite_code: string | null;
}

const inputCls = "w-full h-10 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

export default function AdminTeamsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSport, setTeamSport] = useState("");
  const [creating, setCreating] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id, full_name, role, organization_id").eq("auth_user_id", user.id).single();
      if (!prof) return;
      setProfile(prof);

      const { data: teamData } = await supabase.from("teams").select("id, name, sport").eq("organization_id", prof.organization_id).order("name");
      if (!teamData) { setLoading(false); return; }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const teamsWithStats: TeamWithStats[] = await Promise.all(
        teamData.map(async (team) => {
          const { count: athleteCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("team_id", team.id).eq("role", "athlete");
          const { data: recentCheckins } = await supabase.from("checkins")
            .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score")
            .eq("team_id", team.id).gte("completed_at", weekAgo);

          const byAthlete = new Map<string, { e: number; rec: number; res: number; sup: number }>();
          recentCheckins?.forEach((c) => {
            if (!byAthlete.has(c.athlete_id)) {
              byAthlete.set(c.athlete_id, { e: c.emotional_score ?? 5, rec: c.recovery_score ?? 5, res: c.resilience_score ?? 5, sup: c.support_score ?? 5 });
            }
          });

          let green = 0, yellow = 0, red = 0;
          byAthlete.forEach(({ e, rec, res, sup }) => {
            if (e > 8 || rec < 3) red++;
            else if (e < 5 || rec < 5 || res < 5 || sup < 5) yellow++;
            else green++;
          });

          const { data: inviteData } = await supabase.from("invite_codes").select("code").eq("team_id", team.id).eq("role", "athlete").limit(1);
          return {
            id: team.id, name: team.name, sport: team.sport,
            athlete_count: athleteCount || 0,
            checkin_rate: (athleteCount || 0) > 0 ? Math.round((byAthlete.size / (athleteCount || 1)) * 100) : 0,
            risk_distribution: { green, yellow, red },
            invite_code: inviteData?.[0]?.code || null,
          };
        })
      );

      setTeams(teamsWithStats);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreateTeam = async () => {
    if (!profile || !teamName.trim() || !teamSport.trim()) return;
    setCreating(true);
    const supabase = createClient();
    const { data: team, error } = await supabase.from("teams").insert({
      organization_id: profile.organization_id, name: teamName.trim(), sport: teamSport.trim(),
    }).select().single();

    if (team && !error) {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("invite_codes").insert({
        organization_id: profile.organization_id, team_id: team.id,
        code, role: "athlete", created_by: profile.id,
      });
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id, action: "create", target_type: "team", target_id: team.id,
        metadata: { name: teamName.trim(), sport: teamSport.trim() },
      });
      setTeams((prev) => [...prev, {
        id: team.id, name: team.name, sport: team.sport,
        athlete_count: 0, checkin_rate: 0,
        risk_distribution: { green: 0, yellow: 0, red: 0 },
        invite_code: code,
      }]);
      setShowForm(false); setTeamName(""); setTeamSport("");
    }
    setCreating(false);
  };

  const copyInviteCode = (teamId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(teamId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <div className="h-5 w-5 rounded-full border-2 animate-spin" style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Teams</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {teams.length} team{teams.length !== 1 ? "s" : ""} in your organization
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl transition-all"
            style={showForm
              ? { border: `1px solid ${T.border}`, color: T.textSub, background: T.raised }
              : { background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})`, color: "#fff" }}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Team"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-3xl p-5 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[14px] font-semibold" style={{ color: T.greenDeep }}>Add Team</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Team Name</label>
                <input
                  placeholder="e.g., Men's Basketball"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Sport</label>
                <input
                  placeholder="e.g., Basketball"
                  value={teamSport}
                  onChange={(e) => setTeamSport(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
            </div>
            <button
              onClick={handleCreateTeam}
              disabled={!teamName.trim() || !teamSport.trim() || creating}
              className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
            >
              {creating ? "Creating..." : "Create Team"}
            </button>
          </div>
        )}

        {/* Teams list */}
        {teams.length === 0 ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Users className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
            <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No teams yet</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>Create your first team to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {teams.map((team) => {
              const isExpanded = expandedId === team.id;
              const totalRisk = team.risk_distribution.green + team.risk_distribution.yellow + team.risk_distribution.red;
              return (
                <div key={team.id} className="rounded-3xl overflow-hidden" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : team.id)}
                    className="w-full text-left px-5 py-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.raised }}>
                          <Users className="h-4 w-4" style={{ color: T.textMuted }} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>{team.name}</h3>
                          <p className="text-[12px]" style={{ color: T.textMuted }}>{team.sport}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[13px] font-semibold" style={{ color: T.text }}>{team.athlete_count} athletes</p>
                          <p className="text-[11px]" style={{ color: T.textMuted }}>{team.checkin_rate}% checked in</p>
                        </div>
                        {isExpanded
                          ? <ChevronUp className="h-4 w-4" style={{ color: T.textMuted }} />
                          : <ChevronDown className="h-4 w-4" style={{ color: T.textMuted }} />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 space-y-4" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                      <div className="pt-4">
                        {/* Risk distribution */}
                        {totalRisk > 0 && (
                          <div className="mb-4">
                            <p className="text-[12px] font-semibold mb-2" style={{ color: T.textSub }}>This Week&apos;s Health</p>
                            <div className="flex h-3 rounded-full overflow-hidden mb-2" style={{ background: T.borderSub }}>
                              {team.risk_distribution.green > 0 && (
                                <div style={{ width: `${(team.risk_distribution.green / totalRisk) * 100}%`, background: "#22c55e" }} />
                              )}
                              {team.risk_distribution.yellow > 0 && (
                                <div style={{ width: `${(team.risk_distribution.yellow / totalRisk) * 100}%`, background: "#f59e0b" }} />
                              )}
                              {team.risk_distribution.red > 0 && (
                                <div style={{ width: `${(team.risk_distribution.red / totalRisk) * 100}%`, background: "#ef4444" }} />
                              )}
                            </div>
                            <div className="flex gap-4 text-[11px]" style={{ color: T.textMuted }}>
                              <span>Green: {team.risk_distribution.green}</span>
                              <span>Yellow: {team.risk_distribution.yellow}</span>
                              <span>Red: {team.risk_distribution.red}</span>
                            </div>
                          </div>
                        )}

                        {/* Invite code */}
                        {team.invite_code && (
                          <div className="rounded-2xl p-3" style={{ background: T.raised, border: `1px solid ${T.borderSub}` }}>
                            <p className="text-[11px] mb-1.5" style={{ color: T.textMuted }}>Athlete Invite Code</p>
                            <div className="flex items-center gap-2">
                              <code className="text-[20px] font-mono font-bold tracking-wider" style={{ color: T.text }}>
                                {team.invite_code}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyInviteCode(team.id, team.invite_code!);
                                }}
                                className="p-1.5 rounded-lg transition-colors"
                                style={{ color: T.textMuted, background: "transparent" }}
                              >
                                {copiedId === team.id
                                  ? <Check className="h-4 w-4" style={{ color: T.green }} />
                                  : <Copy className="h-4 w-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
