"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Trash2, ExternalLink } from "lucide-react";

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

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: "crisis",     label: "Crisis" },
  { value: "counseling", label: "Counseling" },
  { value: "wellness",   label: "Wellness" },
  { value: "other",      label: "Other" },
];

const CATEGORY_STYLE: Record<string, { color: string; bg: string }> = {
  crisis:     { color: "#dc2626", bg: "#fee2e2" },
  counseling: { color: "#0f766e", bg: "#ccfbf1" },
  wellness:   { color: "#047857", bg: "#d1fae5" },
  other:      { color: T.textMuted, bg: T.borderSub },
};

const inputCls = "w-full h-10 px-3.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors";

export default function AdminResourcesPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("wellness");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadResources = async () => {
    const supabase = createClient();
    const { data } = await supabase.from("resources").select("*").order("category").order("title");
    if (data) setResources(data);
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase.from("profiles").select("id, full_name, role, organization_id").eq("auth_user_id", user.id).single();
      if (prof) setProfile(prof);
      await loadResources();
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async () => {
    if (!profile || !formTitle.trim() || !formUrl.trim()) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase.from("resources").insert({
      organization_id: profile.organization_id,
      title: formTitle.trim(), description: formDesc.trim(),
      category: formCategory, url: formUrl.trim(), created_by: profile.id,
    });
    if (error) {
      console.error("Add resource error:", error);
      setSaveError(
        error.code === "42501"
          ? "Permission denied. Your account may not have rights to add resources."
          : (error.message ?? "Failed to save resource. Please try again.")
      );
      setSaving(false);
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id, action: "create", target_type: "resource",
      metadata: { title: formTitle.trim(), category: formCategory },
    });
    await loadResources();
    setShowForm(false); setFormTitle(""); setFormDesc(""); setFormCategory("wellness"); setFormUrl("");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    setDeleteError(null);
    const supabase = createClient();
    const { error } = await supabase.from("resources").delete().eq("id", id);
    if (error) {
      setDeleteError(
        error.code === "42501"
          ? "Permission denied — your account may not have rights to delete resources."
          : (error.message ?? "Failed to delete resource. Please try again.")
      );
      return;
    }
    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id, action: "delete", target_type: "resource", target_id: id,
    });
    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const roleName = profile?.role === "support" ? "Support" : profile?.role === "psychiatrist" ? "Psychiatrist" : "Admin";

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
    <DashboardLayout role={(profile?.role as "admin" | "support" | "psychiatrist") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-bold tracking-tight" style={{ color: T.text }}>Resources</h1>
            <p className="text-[13px] mt-0.5" style={{ color: T.textMuted }}>Manage support resources visible to athletes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 h-9 px-4 text-[13px] font-semibold rounded-xl transition-all self-start"
            style={showForm
              ? { border: `1px solid ${T.border}`, color: T.textSub, background: T.raised }
              : { background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})`, color: "#fff" }}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add Resource"}
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <div className="rounded-3xl p-5 space-y-4" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[14px] font-semibold" style={{ color: T.greenDeep }}>Add Resource</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Title</label>
                <input
                  placeholder="Resource name"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className={inputCls}
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Description</label>
                <textarea
                  placeholder="Brief description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] bg-white focus:outline-none transition-colors resize-none"
                  style={{ borderColor: T.border, color: T.text }}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: T.border, color: T.text }}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-medium mb-1.5" style={{ color: T.textSub }}>URL</label>
                  <input
                    placeholder="https://..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    className={inputCls}
                    style={{ borderColor: T.border, color: T.text }}
                  />
                </div>
              </div>
              {saveError && (
                <div className="rounded-xl px-4 py-3 text-[12px] font-medium" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid #fca5a5" }}>
                  {saveError}
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={!formTitle.trim() || !formUrl.trim() || saving}
                className="h-9 px-5 text-[13px] font-semibold text-white rounded-xl disabled:opacity-50 transition-opacity hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${T.greenDeep}, ${T.green})` }}
              >
                {saving ? "Saving..." : "Add Resource"}
              </button>
            </div>
          </div>
        )}

        {/* Delete error banner */}
        {deleteError && (
          <div className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
               style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
            <span className="text-[13px] font-medium" style={{ color: "#991b1b" }}>{deleteError}</span>
            <button onClick={() => setDeleteError(null)} style={{ color: "#991b1b" }}>
              <span className="text-[18px] leading-none">×</span>
            </button>
          </div>
        )}

        {/* Resource list */}
        {resources.length === 0 ? (
          <div className="rounded-3xl p-14 text-center" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            <p className="text-[16px] font-semibold mb-1" style={{ color: T.text }}>No resources yet</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>Add resources that athletes can access for support.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {resources.map((resource) => {
              const cat = CATEGORY_STYLE[resource.category] || CATEGORY_STYLE.other;
              return (
                <div key={resource.id} className="rounded-3xl p-4" style={{ background: T.surface, border: `1px solid ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-[14px]" style={{ color: T.text }}>{resource.title}</h3>
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: cat.bg, color: cat.color }}
                        >
                          {resource.category}
                        </span>
                      </div>
                      {resource.description && (
                        <p className="text-[13px] mt-1" style={{ color: T.textMuted }}>{resource.description}</p>
                      )}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[12px] mt-1 hover:underline"
                        style={{ color: T.green }}
                      >
                        {resource.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="h-8 w-8 flex items-center justify-center rounded-xl border shrink-0 transition-colors"
                      style={{ borderColor: "#fca5a5", color: "#dc2626", background: "#fff" }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
