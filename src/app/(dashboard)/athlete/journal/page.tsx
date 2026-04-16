"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen, Plus, X, Trash2, ChevronDown, ChevronUp,
  Lock, Edit2, AlertCircle, Search,
} from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

export default function AthleteJournalPage() {
  const [profile, setProfile]     = useState<{ full_name: string; id: string } | null>(null);
  const [entries, setEntries]     = useState<JournalEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle]         = useState("");
  const [body, setBody]           = useState("");
  const [saving, setSaving]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadEntries = async (athleteId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("journals")
      .select("id, title, body, created_at")
      .eq("athlete_id", athleteId)
      .order("created_at", { ascending: false });
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
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setShowForm(true);
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setBody("");
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Journal</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Lock className="h-3 w-3 text-emerald-600" />
              <p className="text-[13px] text-slate-500">Private — only you can see this</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-white px-3.5 py-2 rounded-xl transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              <Plus className="h-4 w-4" />
              New entry
            </button>
          )}
        </div>

        {/* Search bar */}
        {entries.length > 2 && !showForm && (
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search entries…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 text-[13px] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mandatory reporter notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[12px] text-amber-800 leading-relaxed">
            <span className="font-semibold">Heads up:</span> Staff who are mandatory reporters under Title IX or state law may have legal obligations if they become aware of disclosures of abuse or harm — through any channel.
          </p>
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {editingId ? "Edit Entry" : "New Journal Entry"}
              </h2>
              <button onClick={resetForm} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="What's on your mind?"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate-700 mb-1.5">Entry</label>
                <textarea
                  placeholder="Write your thoughts freely..."
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={8}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors resize-none leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-2.5">
                  <button
                    onClick={handleSave}
                    disabled={!title.trim() || !body.trim() || saving}
                    className="h-9 px-4 disabled:opacity-50 text-white font-semibold text-[13px] rounded-lg transition-opacity hover:opacity-90 flex items-center gap-1.5"
                    style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
                  >
                    {saving ? (
                      <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (editingId ? "Update" : "Save Entry")}
                  </button>
                  <button
                    onClick={resetForm}
                    className="h-9 px-4 border border-slate-200 hover:border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-[13px] rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {body.trim() && (
                  <p className="text-[11px] text-slate-400">
                    {body.trim().split(/\s+/).filter(Boolean).length} words
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-4" />
            <h2 className="text-[17px] font-semibold text-slate-900 mb-1.5">Your journal is empty</h2>
            <p className="text-[14px] text-slate-500 mb-5 leading-relaxed max-w-xs mx-auto">
              Write to process your thoughts. Everything here stays completely private.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}
            >
              <Plus className="h-4 w-4" />
              Write your first entry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {entries
              .filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.body.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(entry => {
              const isExpanded = expandedId === entry.id;
              const preview = entry.body.length > 160 ? entry.body.substring(0, 160) + "…" : entry.body;

              return (
                <div key={entry.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    className="w-full text-left px-5 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-[15px] text-slate-900 truncate">{entry.title}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(entry.created_at)}</p>
                        {!isExpanded && (
                          <p className="text-[13px] text-slate-500 mt-2 leading-relaxed line-clamp-2">{preview}</p>
                        )}
                      </div>
                      <div className="shrink-0 mt-0.5 text-slate-300">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <p className="text-[14px] text-slate-700 whitespace-pre-wrap leading-relaxed pt-4">{entry.body}</p>

                      {/* Action row */}
                      <div className="flex items-center gap-2 mt-4">
                        <button
                          onClick={() => startEdit(entry)}
                          className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="h-3 w-3" /> Edit
                        </button>

                        {deleteConfirmId === entry.id ? (
                          <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[12px] text-slate-500">Delete this entry?</span>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="h-8 px-3 text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                              Yes, delete
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="h-8 px-3 text-[12px] font-medium text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(entry.id)}
                            className="flex items-center gap-1.5 h-8 px-3 text-[12px] font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-lg transition-colors ml-auto"
                          >
                            <Trash2 className="h-3 w-3" /> Delete
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
          <p className="text-center text-[11px] text-slate-400">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"} · All private · Accessible only to you
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
