"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Users, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

interface TeamWithStats {
  id: string;
  name: string;
  sport: string;
  athlete_count: number;
  checkin_rate: number;
  risk_distribution: { green: number; yellow: number; red: number };
  invite_code: string | null;
}

export default function AdminTeamsPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [teams, setTeams] = useState<TeamWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Create team form
  const [showForm, setShowForm] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamSport, setTeamSport] = useState("");
  const [creating, setCreating] = useState(false);

  // Copy invite code
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name, role, organization_id")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      // Get teams in org
      const { data: teamData } = await supabase
        .from("teams")
        .select("id, name, sport")
        .eq("organization_id", prof.organization_id)
        .order("name");

      if (!teamData) {
        setLoading(false);
        return;
      }

      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get stats for each team
      const teamsWithStats: TeamWithStats[] = await Promise.all(
        teamData.map(async (team) => {
          const { count: athleteCount } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .eq("team_id", team.id)
            .eq("role", "athlete");

          const { data: recentCheckins } = await supabase
            .from("checkins")
            .select("athlete_id, emotional_score, resilience_score, recovery_score, support_score")
            .eq("team_id", team.id)
            .gte("completed_at", weekAgo);

          // Dedupe by athlete (first = most recent)
          const byAthlete = new Map<string, { e: number; rec: number; res: number; sup: number }>();
          recentCheckins?.forEach((c) => {
            if (!byAthlete.has(c.athlete_id)) {
              byAthlete.set(c.athlete_id, {
                e:   c.emotional_score  ?? 5,
                rec: c.recovery_score   ?? 5,
                res: c.resilience_score ?? 5,
                sup: c.support_score    ?? 5,
              });
            }
          });

          let green = 0, yellow = 0, red = 0;
          byAthlete.forEach(({ e, rec, res, sup }) => {
            if (e > 8 || rec < 3) red++;
            else if (e < 5 || rec < 5 || res < 5 || sup < 5) yellow++;
            else green++;
          });

          const total = athleteCount || 0;
          const checkedIn = byAthlete.size;

          // Get invite code for athletes
          const { data: inviteData } = await supabase
            .from("invite_codes")
            .select("code")
            .eq("team_id", team.id)
            .eq("role", "athlete")
            .limit(1);

          return {
            id: team.id,
            name: team.name,
            sport: team.sport,
            athlete_count: total,
            checkin_rate: total > 0 ? Math.round((checkedIn / total) * 100) : 0,
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

    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        organization_id: profile.organization_id,
        name: teamName.trim(),
        sport: teamSport.trim(),
      })
      .select()
      .single();

    if (team && !error) {
      // Generate invite code for athletes
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("invite_codes").insert({
        organization_id: profile.organization_id,
        team_id: team.id,
        code,
        role: "athlete",
        created_by: profile.id,
      });

      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id,
        action: "create",
        target_type: "team",
        target_id: team.id,
        metadata: { name: teamName.trim(), sport: teamSport.trim() },
      });

      setTeams((prev) => [
        ...prev,
        {
          id: team.id,
          name: team.name,
          sport: team.sport,
          athlete_count: 0,
          checkin_rate: 0,
          risk_distribution: { green: 0, yellow: 0, red: 0 },
          invite_code: code,
        },
      ]);

      setShowForm(false);
      setTeamName("");
      setTeamSport("");
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
          <p className="text-slate-500">Loading teams...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Teams</h1>
            <p className="text-slate-500 mt-1">
              {teams.length} team{teams.length !== 1 ? "s" : ""} in your organization
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Cancel" : "Add Team"}
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Add Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Team Name</Label>
                  <Input
                    placeholder="e.g., Men's Basketball"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Input
                    placeholder="e.g., Basketball"
                    value={teamSport}
                    onChange={(e) => setTeamSport(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreateTeam} disabled={!teamName.trim() || !teamSport.trim() || creating}>
                {creating ? "Creating..." : "Create Team"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Teams list */}
        {teams.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900">No teams yet</p>
              <p className="text-slate-500 mt-1">Create your first team to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {teams.map((team) => {
              const isExpanded = expandedId === team.id;
              const totalRisk = team.risk_distribution.green + team.risk_distribution.yellow + team.risk_distribution.red;

              return (
                <Card key={team.id}>
                  <CardContent className="py-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : team.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-slate-400" />
                          <div>
                            <h3 className="font-medium text-slate-900">{team.name}</h3>
                            <p className="text-xs text-slate-400">{team.sport}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{team.athlete_count} athletes</p>
                            <p className="text-xs text-slate-400">{team.checkin_rate}% checked in</p>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                        {/* Risk distribution */}
                        {totalRisk > 0 && (
                          <div>
                            <p className="text-sm font-medium text-slate-700 mb-2">This Week&apos;s Health</p>
                            <div className="flex h-3 rounded-full overflow-hidden mb-2">
                              {team.risk_distribution.green > 0 && (
                                <div
                                  className="bg-green-400"
                                  style={{ width: `${(team.risk_distribution.green / totalRisk) * 100}%` }}
                                />
                              )}
                              {team.risk_distribution.yellow > 0 && (
                                <div
                                  className="bg-amber-400"
                                  style={{ width: `${(team.risk_distribution.yellow / totalRisk) * 100}%` }}
                                />
                              )}
                              {team.risk_distribution.red > 0 && (
                                <div
                                  className="bg-red-400"
                                  style={{ width: `${(team.risk_distribution.red / totalRisk) * 100}%` }}
                                />
                              )}
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500">
                              <span>Green: {team.risk_distribution.green}</span>
                              <span>Yellow: {team.risk_distribution.yellow}</span>
                              <span>Red: {team.risk_distribution.red}</span>
                            </div>
                          </div>
                        )}

                        {/* Invite code */}
                        {team.invite_code && (
                          <div className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-500 mb-1">Athlete Invite Code</p>
                            <div className="flex items-center gap-2">
                              <code className="text-lg font-mono font-bold text-slate-900 tracking-wider">
                                {team.invite_code}
                              </code>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyInviteCode(team.id, team.invite_code!);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-200 transition-colors"
                              >
                                {copiedId === team.id ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
