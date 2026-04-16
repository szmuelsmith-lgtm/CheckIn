"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Check, Heart, Users, Bell, Flame } from "lucide-react";

interface Preferences {
  wants_faith_support: boolean;
  wants_family_checkins: boolean;
  wants_peer_support: boolean;
  opt_out_reminders: boolean;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[28px] w-[50px] shrink-0 rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-emerald-600" : "bg-slate-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white shadow-md transform transition-transform duration-200 mt-[2px] ml-[2px] ${
          checked ? "translate-x-[22px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

interface PrefRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

function PrefRow({ icon, label, description, checked, onChange }: PrefRowProps) {
  return (
    <div className="flex items-center justify-between py-4 gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-slate-500 mt-0.5">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-slate-900">{label}</p>
          <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
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
        .from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
      if (!prof) return;
      setProfile(prof);
      const { data: existingPrefs } = await supabase
        .from("athlete_preferences").select("*").eq("athlete_id", prof.id).single();
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const { error } = await supabase
      .from("athlete_preferences")
      .upsert({ athlete_id: profile.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "athlete_id" });
    if (!error) {
      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id, action: "update", target_type: "preferences",
        target_id: profile.id, metadata: prefs,
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
          <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Preferences</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Customize your Check-In experience. All settings are optional.</p>
        </div>

        {/* Check-In Options */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Check-In Questions</p>
            <p className="text-[12px] text-slate-500 mt-0.5">These add optional questions to your weekly check-in.</p>
          </div>
          <div className="px-5 divide-y divide-slate-100">
            <PrefRow
              icon={<Flame className="h-4 w-4" />}
              label="Faith & values"
              description="Include spiritual well-being questions in your check-ins"
              checked={prefs.wants_faith_support}
              onChange={v => setPrefs(p => ({ ...p, wants_faith_support: v }))}
            />
            <PrefRow
              icon={<Heart className="h-4 w-4" />}
              label="Family & home life"
              description="Include questions about family and home stress"
              checked={prefs.wants_family_checkins}
              onChange={v => setPrefs(p => ({ ...p, wants_family_checkins: v }))}
            />
            <PrefRow
              icon={<Users className="h-4 w-4" />}
              label="Peer support"
              description="Signal you're open to peer mentoring or buddy check-ins"
              checked={prefs.wants_peer_support}
              onChange={v => setPrefs(p => ({ ...p, wants_peer_support: v }))}
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Notifications</p>
          </div>
          <div className="px-5">
            <PrefRow
              icon={<Bell className="h-4 w-4" />}
              label="Weekly reminders"
              description={prefs.opt_out_reminders ? "Reminders are off — you won't receive email nudges" : "You'll receive weekly email reminders to check in"}
              checked={!prefs.opt_out_reminders}
              onChange={v => setPrefs(p => ({ ...p, opt_out_reminders: !v }))}
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 disabled:opacity-60 text-white font-semibold text-[14px] rounded-xl transition-opacity hover:opacity-90 flex items-center gap-2"
            style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
          >
            {saving ? (
              <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : "Save Preferences"}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-[13px] text-emerald-700 font-medium">
              <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </div>
              Saved
            </div>
          )}
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          These preferences are stored securely and only affect what you see in your own check-ins. They are never shared with coaches.
        </p>
      </div>
    </DashboardLayout>
  );
}
