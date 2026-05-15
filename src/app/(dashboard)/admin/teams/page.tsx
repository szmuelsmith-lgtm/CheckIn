"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Users, ChevronDown, ChevronUp, Copy, Check, ToggleLeft, ToggleRight, RefreshCw, Link2 } from "lucide-react";

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

const COMMON_SPORTS = [
  "Baseball", "Basketball", "Cross Country", "Football", "Golf",
  "Gymnastics", "Ice Hockey", "Lacrosse", "Rowing", "Soccer",
  "Softball", "Swimming & Diving", "Tennis", "Track & Field",
  "Volleyball", "Water Polo", "Wrestling",
];

const DIVISIONS = ["D1", "D2", "D3", "NAIA", "NJCAA", "Club"];

interface TeamWithStats {
  id: string;
  name: string;
  sport: string;
  season: string | null;
  active: boolean;
  athlete_count: number;
  checkin_rate: number;
  risk_distribution: { green: number; yellow: number; red: number };
  invite_codes: { code: string; role: string }[];
}

interface OrgInfo {
  id: string;
  name: string;
  division: string | null;
  conference: string | null;
}

const inputCls = "w-full h-10 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function AdminTeamsPage() {
  const [profile, setProfile]     = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [org, setOrg]             = useState<OrgInfo | null>(null);
  const [teams, setTeams]         = useState<TeamWithStats[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showInactiveTeams, setShowInactiveTeams] = useState(false);

  // Create form
  const [showForm, setShowForm]   = useState(false);
  const [teamName, setTeamName]   = useState("");
  const [teamSport, setTeamSport] = useState("");
  const [teamSeason, setTeamSeason] = useState("");
  const [creating, setCreating]   = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Org edit
  const [editingOrg, setEditingOrg] = useState(false);
  const [orgDivision, setOrgDivision] = useState("");
  const [orgConference, setOrgConference] = useState("");
  const [savingOrg, setSavingOrg] = useState(false);
  const [orgSaveError, setOrgSaveError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [copiedId, setCopiedId]   = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles")
        .select("id, full_name, role, organization_id").eq("auth_user_id", user.id).single();
      if (!prof) return;
      setProfile(prof);

      if (prof.organization_id) {
        const { data: orgData } = await supabase.from("organizations")
          .select("id, name, division, conference").eq("id", prof.organization_id).single();
        if (orgData) {
          setOrg(orgData);
          setOrgDivision(orgData.division || "");
          setOrgConference(orgData.conference || "");
        }
      }

      const { data: teamData } = await supabase.from("teams")
        .select("id, name, sport, season, active")
        .eq("organization_id", prof.organization_id)
        .order("active", { ascending: false })
        .order("name");
      if (!teamData) { setLoading(false); return; }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const teamsWithStats: TeamWithStats[] = await Promise.all(
        teamData.map(async (team) => {
          const { count: athleteCount } = await supabase.from("profiles")
            .select("*", { count: "exact", head: true }).eq("team_id", team.id).eq("role", "athlete");
          const { data: recentCheckins } = await supabase.from("checkins")
            .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score")
            .eq("team_id", team.id).gte("completed_at", weekAgo);

          const byAthlete = new Map<string, { e: number; rec: number; res: number; sup: number }>();
          recentCheckins?.forEach((c) => {
            if (!byAthlete.has(c.athlete_id)) {
              byAthlete.set(c.athlete_id, {
                e: c.emotional_score ?? 5, rec: c.recovery_score ?? 5,
                res: c.resilience_score ?? 5, sup: c.support_score ?? 5,
              });
            }
          });

          let green = 0, yellow = 0, red = 0;
          byAthlete.forEach(({ e, rec, res, sup }) => {
            const avg = (e + rec + res + sup) / 4;
            if (avg < 4) red++;
            else if (avg < 6) yellow++;
            else green++;
          });

          const { data: inviteData } = await supabase.from("invite_codes")
            .select("code, role").eq("team_id", team.id).order("role");

          return {
            id: team.id, name: team.name, sport: team.sport,
            season: team.season || null, active: team.active ?? true,
            athlete_count: athleteCount || 0,
            checkin_rate: (athleteCount || 0) > 0
              ? Math.round((byAthlete.size / (athleteCount || 1)) * 100) : 0,
            risk_distribution: { green, yellow, red },
            invite_codes: inviteData || [],
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
    setCreateError(null);
    const supabase = createClient();
    const { data: team, error } = await supabase.from("teams").insert({
      organization_id: profile.organization_id,
      name: teamName.trim(),
      sport: teamSport.trim(),
      season: teamSeason.trim() || null,
      active: true,
    }).select().single();

    if (error || !team) {
      console.error("Create team error:", error);
      setCreateError(
        error?.code === "42501"
          ? "Permission denied. Your account may not have admin rights to create teams."
          : (error?.message ?? "Failed to create team. Please try again.")
      );
      setCreating(false);
      return;
    }

    const athleteCode = generateCode();
    const coachCode   = generateCode();
    await supabase.from("invite_codes").insert([
      { organization_id: profile.organization_id, team_id: team.id, code: athleteCode, role: "athlete", created_by: profile.id },
      { organization_id: profile.organization_id, team_id: team.id, code: coachCode,   role: "coach",   created_by: profile.id },
    ]);
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id, action: "create", target_type: "team", target_id: team.id,
      metadata: { name: teamName.trim(), sport: teamSport.trim(), season: teamSeason.trim() || null },
    });
    setTeams((prev) => [...prev, {
      id: team.id, name: team.name, sport: team.sport,
      season: team.season || null, active: true,
      athlete_count: 0, checkin_rate: 0,
      risk_distribution: { green: 0, yellow: 0, red: 0 },
      invite_codes: [{ code: athleteCode, role: "athlete" }, { code: coachCode, role: "coach" }],
    }]);
    setShowForm(false); setTeamName(""); setTeamSport(""); setTeamSeason("");
    setCreating(false);
  };

  const handleToggleActive = async (teamId: string, currentActive: boolean) => {
    setActionError(null);
    const supabase = createClient();
    const { error } = await supabase.from("teams").update({ active: !currentActive }).eq("id", teamId);
    if (error) {
      setActionError(error.message ?? "Failed to update team status. Please try again.");
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile?.id, action: "update", target_type: "team", target_id: teamId,
      metadata: { active: !currentActive },
    });
    setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, active: !currentActive } : t));
  };

  const handleRegenerateCode = async (teamId: string, role: string) => {
    setActionError(null);
    const supabase = createClient();
    const newCode = generateCode();
    const { error } = await supabase.from("invite_codes")
      .update({ code: newCode })
      .eq("team_id", teamId).eq("role", role);
    if (error) {
      setActionError(error.message ?? "Failed to regenerate invite code. Please try again.");
      return;
    }
    setTeams((prev) => prev.map((t) => t.id === teamId
      ? { ...t, invite_codes: t.invite_codes.map((ic) => ic.role === role ? { ...ic, code: newCode } : ic) }
      : t));
  };

  const handleSaveOrg = async () => {
    if (!org) return;
    setSavingOrg(true);
    setOrgSaveError(null);
    const supabase = createClient();
    const { error } = await supabase.from("organizations").update({
      division:   orgDivision.trim() || null,
      conference: orgConference.trim() || null,
    }).eq("id", org.id);
    if (error) {
      setOrgSaveError(error.message ?? "Failed to save organization info. Please try again.");
      setSavingOrg(false);
      return;
    }
    setOrg((o) => o ? { ...o, division: orgDivision.trim() || null, conference: orgConference.trim() || null } : o);
    setEditingOrg(false);
    setSavingOrg(false);
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const copyInviteLink = (id: string, code: string) => {
    const base = typeof window !== "undefined" ? window.location.origin : "https://check-in-gilt.vercel.app";
    navigator.clipboard.writeText(`${base}/signup?invite=${code}`);
    setCopiedId(`link-${id}`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeTeams   = teams.filter((t) => t.active);
  const inactiveTeams = teams.filter((t) => !t.active);
  const visibleTeams  = showInactiveTeams ? teams : activeTeams;

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
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || "Admin"}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Teams</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>
              {activeTeams.length} active team{activeTeams.length !== 1 ? "s" : ""}
              {inactiveTeams.length > 0 && ` · ${inactiveTeams.length} inactive`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl transition-all self-start"
            style={showForm
              ? { border: `1px solid ${T.border}`, color: T.textSub, background: T.raised }
              : { background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})`, color: "#fff" }}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Team"}
          </button>
        </div>

        {/* Action error banner */}
        {actionError && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
               style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <span className="text-[13px] font-medium" style={{ color: "#991b1b" }}>{actionError}</span>
            <button onClick={() => setActionError(null)} style={{ color: "#991b1b" }}>
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>
        )}

        {/* Org info card */}
        {org && (
          <div className="rounded-3xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>{org.name}</p>
              <button
                onClick={() => setEditingOrg(!editingOrg)}
                className="text-[12px] font-medium hover:underline"
                style={{ color: T.green }}
              >
                {editingOrg ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingOrg ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>Division</label>
                  <select
                    value={orgDivision}
                    onChange={(e) => setOrgDivision(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: T.border, color: T.text }}
                  >
                    <option value="">— Select —</option>
                    {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>Conference</label>
                  <input
                    placeholder="e.g. ACC, Big Ten"
                    value={orgConference}
                    onChange={(e) => setOrgConference(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: T.border, color: T.text }}
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  {orgSaveError && (
                    <div className="rounded-xl px-4 py-3 text-[12px] font-medium" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                      {orgSaveError}
                    </div>
                  )}
                  <button
                    onClick={handleSaveOrg}
                    disabled={savingOrg}
                    className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
                  >
                    {savingOrg ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-4">
                {org.division && (
                  <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: "#f0fdf4", color: T.green, border: `1px solid #bbf7d0` }}>
                    {org.division}
                  </span>
                )}
                {org.conference && (
                  <span className="text-[12px] px-2.5 py-1 rounded-full font-semibold"
                        style={{ background: T.raised, color: T.textSub, border: `1px solid ${T.border}` }}>
                    {org.conference}
                  </span>
                )}
                {!org.division && !org.conference && (
                  <p className="text-[12px] italic" style={{ color: T.textMuted }}>No division or conference set — tap Edit to add.</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <div className="rounded-3xl p-5 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[14px] font-semibold" style={{ color: T.greenDeep }}>New Team</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>Team Name</label>
                <input
                  placeholder="e.g., Men's Basketball"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>Sport</label>
                <select
                  value={teamSport}
                  onChange={(e) => setTeamSport(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: teamSport ? T.text : T.textMuted }}
                >
                  <option value="">— Select sport —</option>
                  {COMMON_SPORTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: T.textMuted }}>
                  Season <span className="normal-case font-normal" style={{ color: T.textMuted }}>— optional</span>
                </label>
                <input
                  placeholder="e.g., Fall 2026 or 2026–27"
                  value={teamSeason}
                  onChange={(e) => setTeamSeason(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: T.textMuted }}>
              Two invite codes will be generated automatically — one for athletes, one for coaches.
            </p>
            {createError && (
              <div className="rounded-xl px-4 py-3 text-[12px] font-medium" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                {createError}
              </div>
            )}
            <button
              onClick={handleCreateTeam}
              disabled={!teamName.trim() || !teamSport.trim() || creating}
              className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
            >
              {creating ? "Creating…" : "Create Team"}
            </button>
          </div>
        )}

        {/* Show inactive toggle */}
        {inactiveTeams.length > 0 && (
          <button
            onClick={() => setShowInactiveTeams(!showInactiveTeams)}
            className="text-[12px] font-medium hover:underline"
            style={{ color: T.textMuted }}
          >
            {showInactiveTeams ? "Hide" : "Show"} {inactiveTeams.length} inactive team{inactiveTeams.length !== 1 ? "s" : ""}
          </button>
        )}

        {/* Teams list */}
        {visibleTeams.length === 0 ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <Users className="h-10 w-10 mx-auto mb-4" style={{ color: "#cbd5e1" }} />
            <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No teams yet</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>Create your first team to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTeams.map((team) => {
              const isExpanded = expandedId === team.id;
              const totalRisk  = team.risk_distribution.green + team.risk_distribution.yellow + team.risk_distribution.red;
              return (
                <div key={team.id} className="rounded-3xl overflow-hidden"
                     style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)", opacity: team.active ? 1 : 0.6 }}>
                  <button onClick={() => setExpandedId(isExpanded ? null : team.id)} className="w-full text-left px-5 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: T.raised }}>
                          <Users className="h-4 w-4" style={{ color: T.textMuted }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>{team.name}</h3>
                            {!team.active && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                                    style={{ background: T.raised, color: T.textMuted, border: `1px solid ${T.border}` }}>Inactive</span>
                            )}
                          </div>
                          <p className="text-[12px]" style={{ color: T.textMuted }}>
                            {team.sport}{team.season ? ` · ${team.season}` : ""}
                          </p>
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
                      <div className="pt-4 space-y-4">

                        {/* Risk bar */}
                        {totalRisk > 0 && (
                          <div>
                            <p className="text-[12px] font-semibold mb-2" style={{ color: T.textSub }}>This Week&apos;s Wellness</p>
                            <div className="flex h-3 rounded-full overflow-hidden mb-2 gap-px" style={{ background: T.borderSub }}>
                              {team.risk_distribution.green  > 0 && <div style={{ width: `${(team.risk_distribution.green  / totalRisk) * 100}%`, background: "#22c55e" }} />}
                              {team.risk_distribution.yellow > 0 && <div style={{ width: `${(team.risk_distribution.yellow / totalRisk) * 100}%`, background: "#f59e0b" }} />}
                              {team.risk_distribution.red    > 0 && <div style={{ width: `${(team.risk_distribution.red    / totalRisk) * 100}%`, background: "#ef4444" }} />}
                            </div>
                            <div className="flex gap-4 text-[11px]" style={{ color: T.textMuted }}>
                              <span style={{ color: "#16a34a" }}>● {team.risk_distribution.green} stable</span>
                              <span style={{ color: "#d97706" }}>● {team.risk_distribution.yellow} caution</span>
                              <span style={{ color: "#dc2626" }}>● {team.risk_distribution.red} concern</span>
                            </div>
                          </div>
                        )}

                        {/* Invite codes — one per role */}
                        <div>
                          <p className="text-[12px] font-semibold mb-2.5" style={{ color: T.textSub }}>Invite Codes</p>
                          <div className="space-y-2">
                            {team.invite_codes.length === 0 && (
                              <p className="text-[12px] italic" style={{ color: T.textMuted }}>No invite codes — regenerate to create one.</p>
                            )}
                            {team.invite_codes.map((ic) => {
                              const copyKey = `${team.id}-${ic.role}`;
                              return (
                                <div key={ic.role} className="flex items-center justify-between rounded-2xl px-3 py-2.5"
                                     style={{ background: T.raised, border: `1px solid ${T.borderSub}` }}>
                                  <div>
                                    <p className="text-[10px] font-bold uppercase tracking-wide mb-0.5" style={{ color: T.textMuted }}>
                                      {ic.role === "athlete" ? "Athlete" : ic.role === "coach" ? "Coach" : ic.role}
                                    </p>
                                    <code className="text-[18px] font-mono font-bold tracking-widest" style={{ color: T.text }}>{ic.code}</code>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyCode(copyKey, ic.code); }}
                                      className="p-1.5 rounded-lg"
                                      style={{ color: copiedId === copyKey ? T.green : T.textMuted }}
                                      title="Copy code"
                                    >
                                      {copiedId === copyKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); copyInviteLink(copyKey, ic.code); }}
                                      className="p-1.5 rounded-lg"
                                      style={{ color: copiedId === `link-${copyKey}` ? T.green : T.textMuted }}
                                      title="Copy invite link"
                                    >
                                      {copiedId === `link-${copyKey}` ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleRegenerateCode(team.id, ic.role); }}
                                      className="p-1.5 rounded-lg"
                                      style={{ color: T.textMuted }}
                                      title="Regenerate"
                                    >
                                      <RefreshCw className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                          <div>
                            <p className="text-[13px] font-semibold" style={{ color: T.textSub }}>
                              {team.active ? "Team is active" : "Team is inactive"}
                            </p>
                            <p className="text-[11px]" style={{ color: T.textMuted }}>
                              {team.active ? "Receiving check-ins and alerts" : "Hidden from dashboards, no alerts"}
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleActive(team.id, team.active); }}
                            style={{ color: team.active ? T.green : T.textMuted }}
                          >
                            {team.active
                              ? <ToggleRight className="h-8 w-8" />
                              : <ToggleLeft className="h-8 w-8" />}
                          </button>
                        </div>

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
