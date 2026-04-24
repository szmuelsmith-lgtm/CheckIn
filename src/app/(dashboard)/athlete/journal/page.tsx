"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Plus, X, Trash2, ChevronDown, ChevronUp,
  Lock, Edit2, AlertCircle, Search,
} from "lucide-react";

const T = {
  surface:   "#ffffff",
  bg:        "#f4f7f5",
  raised:    "#f8fafc",
  border:    "#e8edf2",
  borderSub: "#f1f5f9",
  text:      "#0f172a",
  textSub:   "#334155",
  textMuted: "#64748b",
  green:     "#059669",
  greenDeep: "#065f46",
};

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function AthleteJournalPage() {
  const [profile, setProfile]         = useState<{ full_name: string; id: string } | null>(null);
  const [entries, setEntries]         = useState<JournalEntry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [title, setTitle]             = useState("");
  const [body, setBody]               = useState("");
  const [saving, setSaving]           = useState(false);
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadEntries = async (athleteId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journals").select("id, title, body, created_at")
      .eq("athlete_id", athleteId).order("created_at", { ascending: false });
    if (data) setEntries(data);
  };

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles").select("id, full_name").eq("auth_user_id", user.id).single();
      if (!prof) return;
      setProfile(prof);
      await loadEntries(prof.id);
      setLoading(false);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!profile || !title.trim() || !body.trim()) return;
    setSaving(true);
    const supabase = createClient();
    if (editingId) {
      await supabase.from("journals").update({ title: title.trim(), body: body.trim() }).eq("id", editingId);
      await supabase.from("audit_logs").insert({ actor_profile_id: profile.id, action: "update", target_type: "journal", target_id: editingId });
    } else {
      const { data: entry } = await supabase
        .from("journals").insert({ athlete_id: profile.id, title: title.trim(), body: body.trim() }).select().single();
      if (entry) await supabase.from("audit_logs").insert({ actor_profile_id: profile.id, action: "create", target_type: "journal", target_id: entry.id });
    }
    await loadEntries(profile.id);
    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    const supabase = createClient();
    await supabase.from("journals").delete().eq("id", id);
    await supabase.from("audit_logs").insert({ actor_profile_id: profile.id, action: "delete", target_type: "journal", target_id: id });
    setEntries(prev => prev.filter(e => e.id !== id));
    if (expandedId === id) setExpandedId(null);
    setDeleteConfirmId(null);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id); setTitle(entry.title); setBody(entry.body);
    setShowForm(true); setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => { setShowForm(false); setEditingId(null); setTitle(""); setBody(""); };

  if (loading) return (
    <DashboardLayout role="athlete" userName="...">
      <div className="flex items-center justify-center h-64">
        <div className="h-5 w-5 rounded-full border-2 animate-spin"
             style={{ borderColor: T.border, borderTopColor: T.green }} />
      </div>
    </DashboardLayout>
  );

  const filtered = entries.filter(e =>
    !searchQuery ||
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-start justify-between animate-fade-in">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Journal</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Lock className="h-3 w-3" style={{ color: T.green }} />
              <p className="text-[13px]" style={{ color: T.textMuted }}>Private — only you can see this</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-[13px] font-bold text-white px-4 py-2.5 rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #065f46, #059669)",
                boxShadow: "0 3px 10px rgba(5,150,105,0.28)",
              }}
            >
              <Plus className="h-4 w-4" />New entry
            </button>
          )}
        </div>

        {/* Search */}
        {entries.length > 2 && !showForm && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: T.textMuted }} />
            <input
              type="text" placeholder="Search entries…" value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-9 pr-3.5 rounded-2xl text-[13px] placeholder:text-slate-400 focus:outline-none"
              style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: T.textMuted }}>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mandatory reporter notice */}
        <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
             style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#d97706" }} />
          <p className="text-[12px] leading-relaxed" style={{ color: "#92400e" }}>
            <span className="font-semibold">Heads up:</span> Staff who are mandatory reporters under Title IX or state law may have legal obligations if they become aware of disclosures of abuse or harm — through any channel.
          </p>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <div className="rounded-3xl overflow-hidden animate-scale-in"
               style={{ background: T.surface, border: `1px solid #bbf7d0`, boxShadow: "0 4px 20px rgba(5,150,105,0.08)" }}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${T.borderSub}` }}>
              <h2 className="text-[15px] font-bold" style={{ color: T.text }}>
                {editingId ? "Edit Entry" : "New Journal Entry"}
              </h2>
              <button onClick={resetForm} className="p-1.5 rounded-xl" style={{ color: T.textMuted }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: T.textSub }}>Title</label>
                <input
                  type="text" placeholder="What's on your mind?" value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-2xl text-[14px] placeholder:text-slate-400 focus:outline-none"
                  style={{ background: T.raised, border: `1px solid ${T.border}`, color: T.text }}
                />
              </div>
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: T.textSub }}>Entry</label>
                <textarea
                  placeholder="Write your thoughts freely..." value={body}
                  onChange={e => setBody(e.target.value)} rows={8}
                  className="w-full px-3.5 py-3 rounded-2xl text-[14px] placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed"
                  style={{ background: T.raised, border: `1px solid ${T.border}`, color: T.text, caretColor: T.green }}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleSave} disabled={!title.trim() || !body.trim() || saving}
                    className="h-10 px-4 disabled:opacity-50 text-white font-bold text-[13px] rounded-2xl flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 2px 8px rgba(5,150,105,0.25)" }}
                  >
                    {saving
                      ? <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      : (editingId ? "Update" : "Save Entry")}
                  </button>
                  <button
                    onClick={resetForm}
                    className="h-10 px-4 font-medium text-[13px] rounded-2xl"
                    style={{ border: `1px solid ${T.border}`, color: T.textSub }}
                  >
                    Cancel
                  </button>
                </div>
                {body.trim() && (
                  <p className="text-[11px]" style={{ color: T.textMuted }}>
                    {body.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && !showForm ? (
          <div className="rounded-3xl p-12 text-center"
               style={{ background: T.surface, border: `2px dashed ${T.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
            <div className="h-16 w-16 rounded-3xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: "#f0fdf4" }}>
              <BookOpen className="h-8 w-8" style={{ color: "#bbf7d0" }} />
            </div>
            <h2 className="text-[17px] font-bold mb-2" style={{ color: T.text }}>Your journal is empty</h2>
            <p className="text-[14px] mb-6 leading-relaxed max-w-xs mx-auto" style={{ color: T.textMuted }}>
              Write to process your thoughts. Everything here stays completely private.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-white px-5 py-2.5 rounded-2xl"
              style={{ background: "linear-gradient(135deg, #065f46, #059669)", boxShadow: "0 3px 10px rgba(5,150,105,0.28)" }}
            >
              <Plus className="h-4 w-4" />Write your first entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, i) => {
              const isExpanded = expandedId === entry.id;
              const preview    = entry.body.length > 160 ? entry.body.substring(0, 160) + "…" : entry.body;
              return (
                <div
                  key={entry.id}
                  className="rounded-3xl overflow-hidden animate-fade-in-up"
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full text-left px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[15px] truncate" style={{ color: T.text }}>{entry.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: T.textMuted }}>{formatDate(entry.created_at)}</p>
                        {!isExpanded && (
                          <p className="text-[13px] mt-2 leading-relaxed line-clamp-2" style={{ color: T.textSub }}>{preview}</p>
                        )}
                      </div>
                      <span className="shrink-0 mt-0.5" style={{ color: T.textMuted }}>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5" style={{ borderTop: `1px solid ${T.borderSub}` }}>
                      <p className="text-[14px] whitespace-pre-wrap leading-relaxed pt-4" style={{ color: T.textSub }}>
                        {entry.body}
                      </p>
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => startEdit(entry)}
                          className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-semibold rounded-2xl"
                          style={{ border: `1px solid ${T.border}`, color: T.textSub }}
                        >
                          <Edit2 className="h-3 w-3" />Edit
                        </button>

                        {deleteConfirmId === entry.id ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[12px]" style={{ color: T.textMuted }}>Delete this entry?</span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="h-9 px-3 text-[12px] font-bold text-white rounded-2xl"
                              style={{ background: "#ef4444" }}
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="h-9 px-3 text-[12px] font-medium rounded-2xl"
                              style={{ border: `1px solid ${T.border}`, color: T.textMuted }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="flex items-center gap-1.5 h-9 px-3 text-[12px] font-semibold rounded-2xl ml-auto"
                            style={{ border: "1px solid #fecaca", color: "#ef4444" }}
                          >
                            <Trash2 className="h-3 w-3" />Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {entries.length > 0 && (
          <p className="text-center text-[11px]" style={{ color: T.textMuted }}>
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} · All private · Accessible only to you
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
