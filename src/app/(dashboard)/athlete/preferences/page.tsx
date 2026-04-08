"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Check } from "lucide-react";

interface Preferences {
  wants_faith_support: boolean;
  wants_family_checkins: boolean;
  wants_peer_support: boolean;
  opt_out_reminders: boolean;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-4 cursor-pointer py-4">
      <div className="relative mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-emerald-500 transition-colors" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
    </label>
  );
}

export default function AthletePreferencesPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    wants_faith_support: false,
    wants_family_checkins: false,
    wants_peer_support: false,
    opt_out_reminders: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);

      const { data: existingPrefs } = await supabase
        .from("athlete_preferences")
        .select("*")
        .eq("athlete_id", prof.id)
        .single();

      if (existingPrefs) {
        setPrefs({
          wants_faith_support: existingPrefs.wants_faith_support,
          wants_family_checkins: existingPrefs.wants_family_checkins,
          wants_peer_support: existingPrefs.wants_peer_support,
          opt_out_reminders: existingPrefs.opt_out_reminders,
        });
      }

      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    const supabase = createClient();

    // Upsert preferences
    const { error } = await supabase
      .from("athlete_preferences")
      .upsert(
        {
          athlete_id: profile.id,
          ...prefs,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "athlete_id" }
      );

    if (!error) {
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id,
        action: "update",
        target_type: "preferences",
        target_id: profile.id,
        metadata: prefs,
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading preferences...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Preferences</h1>
          <p className="text-slate-500 mt-1">Customize your Check-In experience</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Check-In Options</CardTitle>
            <CardDescription>
              These settings control what optional questions appear in your weekly check-in.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            <Toggle
              checked={prefs.wants_faith_support}
              onChange={(v) => setPrefs({ ...prefs, wants_faith_support: v })}
              label="Faith & values support"
              description="Include questions about faith and spiritual well-being in your check-ins"
            />
            <Toggle
              checked={prefs.wants_family_checkins}
              onChange={(v) => setPrefs({ ...prefs, wants_family_checkins: v })}
              label="Family check-in questions"
              description="Include questions about family and home life stress"
            />
            <Toggle
              checked={prefs.wants_peer_support}
              onChange={(v) => setPrefs({ ...prefs, wants_peer_support: v })}
              label="Peer support"
              description="Let your program know you're open to peer mentoring or buddy check-ins"
            />
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>
              Control how Check-In communicates with you.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Toggle
              checked={prefs.opt_out_reminders}
              onChange={(v) => setPrefs({ ...prefs, opt_out_reminders: v })}
              label="Opt out of weekly reminders"
              description="Stop receiving email reminders to complete your weekly check-in"
            />
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
