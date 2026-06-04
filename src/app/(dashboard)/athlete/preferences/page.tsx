"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Check, Heart, Users, Bell, Flame } from "lucide-react";

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

interface Preferences {
  wants_faith_support:   boolean;
  wants_family_checkins: boolean;
  wants_peer_support:    boolean;
  opt_out_reminders:     boolean;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className="relative inline-flex h-[28px] w-[50px] shrink-0 rounded-full transition-colors duration-200 focus:outline-none"
      style={{ background: checked ? "#059669" : "#e2e8f0" }}
    >
      <span
        className="pointer-events-none inline-block h-[24px] w-[24px] rounded-full bg-white transform transition-transform duration-200 mt-[2px] ml-[2px]"
        style={{
          transform: checked ? "translateX(22px)" : "translateX(0)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        }}
      />
    </button>
  );
}

function PrefRow({ icon, label, description, checked, onChange }: {
  icon: React.ReactNode; label: string; description: string;
  checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-4 gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div
          className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: T.raised, color: T.textMuted }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold" style={{ color: T.text }}>{label}</p>
          <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: T.textMuted }}>{description}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

export default function AthletePreferencesPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [prefs, setPrefs] = useState<Preferences>({
    wants_faith_support: false, wants_family_checkins: false,
    wants_peer_support: false,  opt_out_reminders: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { getMyProfile } = await import("@/lib/current-user");
      const { profile: prof } = await getMyProfile(supabase);
      if (!prof) return;
      setProfile(prof);
      const { data: existingPrefs } = await supabase
        .from("athlete_preferences").select("*").eq("athlete_id", prof.id).single();
      if (existingPrefs) setPrefs({
        wants_faith_support:   existingPrefs.wants_faith_support,
        wants_family_checkins: existingPrefs.wants_family_checkins,
        wants_peer_support:    existingPrefs.wants_peer_support,
        opt_out_reminders:     existingPrefs.opt_out_reminders,
      });
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true); setSaved(false); setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("athlete_preferences")
      .upsert({ athlete_id: profile.id, ...prefs, updated_at: new Date().toISOString() }, { onConflict: "athlete_id" });
    if (error) {
      setSaveError(
        error.code === "42501"
          ? "Permission denied. Your account may not have rights to update preferences."
          : (error.message ?? "Failed to save preferences. Please try again.")
      );
      setSaving(false);
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id, action: "update",
      target_type: "preferences", target_id: profile.id, metadata: prefs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setSaving(false);
  };

  if (loading) return (
    <DashboardLayout role="athlete" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Preferences</h1>
          <p className="text-[14px] mt-0.5" style={{ color: T.textMuted }}>
            Customize your Check-In experience. All settings are optional.
          </p>
        </div>

        {/* Check-In Options */}
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
              Check-In Questions
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: T.textMuted }}>
              These add optional questions to your weekly check-in.
            </p>
          </div>
          <div className="px-5" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <div style={{ borderBottom: `1px solid ${T.borderSub}` }}>
              <PrefRow icon={<Flame className="h-4 w-4" />} label="Faith & values"
                description="Include spiritual well-being questions in your check-ins"
                checked={prefs.wants_faith_support}
                onChange={v => setPrefs(p => ({ ...p, wants_faith_support: v }))} />
            </div>
            <div style={{ borderBottom: `1px solid ${T.borderSub}` }}>
              <PrefRow icon={<Heart className="h-4 w-4" />} label="Family & home life"
                description="Include questions about family and home stress"
                checked={prefs.wants_family_checkins}
                onChange={v => setPrefs(p => ({ ...p, wants_family_checkins: v }))} />
            </div>
            <PrefRow icon={<Users className="h-4 w-4" />} label="Peer support"
              description="Signal you're open to peer mentoring or buddy check-ins"
              checked={prefs.wants_peer_support}
              onChange={v => setPrefs(p => ({ ...p, wants_peer_support: v }))} />
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-3xl overflow-hidden animate-fade-in-up"
             style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: T.textMuted }}>
              Notifications
            </p>
          </div>
          <div className="px-5">
            <PrefRow icon={<Bell className="h-4 w-4" />} label="Weekly reminders"
              description={prefs.opt_out_reminders
                ? "Reminders are off — you won't receive email nudges"
                : "You'll receive weekly email reminders to check in"}
              checked={!prefs.opt_out_reminders}
              onChange={v => setPrefs(p => ({ ...p, opt_out_reminders: !v }))} />
          </div>
        </div>

        {/* Save error */}
        {saveError && (
          <div className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
               style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <span className="text-[13px] font-medium" style={{ color: "#991b1b" }}>{saveError}</span>
            <button onClick={() => setSaveError(null)} style={{ color: "#991b1b" }}>
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>
        )}

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave} disabled={saving}
            className="h-11 px-5 disabled:opacity-60 text-white font-bold text-[14px] rounded-2xl flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #065f46, #059669)",
              boxShadow: "0 3px 10px rgba(5,150,105,0.25)",
            }}
          >
            {saving
              ? <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              : "Save Preferences"}
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: T.green }}>
              <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "#d1fae5" }}>
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </div>
              Saved
            </div>
          )}
        </div>

        <p className="text-[11px] leading-relaxed" style={{ color: T.textMuted }}>
          These preferences are stored securely and only affect what you see in your own check-ins. They are never shared with coaches.
        </p>
      </div>
    </DashboardLayout>
  );
}
