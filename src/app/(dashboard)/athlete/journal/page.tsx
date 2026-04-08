"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Plus, X, Trash2, ChevronDown, ChevronUp, Lock } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export default function AthleteJournalPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string } | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Create/edit state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  // Expanded entry
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        .from("profiles")
        .select("id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (!prof) return;
      setProfile(prof);
      await loadEntries(prof.id);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile || !title.trim() || !body.trim()) return;
    setSaving(true);

    const supabase = createClient();

    if (editingId) {
      await supabase
        .from("journals")
        .update({ title: title.trim(), body: body.trim() })
        .eq("id", editingId);

      await supabase.from("audit_logs").insert({
        actor_profile_id: profile.id,
        action: "update",
        target_type: "journal",
        target_id: editingId,
      });
    } else {
      const { data: entry } = await supabase
        .from("journals")
        .insert({
          athlete_id: profile.id,
          title: title.trim(),
          body: body.trim(),
        })
        .select()
        .single();

      if (entry) {
        await supabase.from("audit_logs").insert({
          actor_profile_id: profile.id,
          action: "create",
          target_type: "journal",
          target_id: entry.id,
        });
      }
    }

    await loadEntries(profile.id);
    resetForm();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    const supabase = createClient();
    await supabase.from("journals").delete().eq("id", id);

    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id,
      action: "delete",
      target_type: "journal",
      target_id: id,
    });

    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setTitle(entry.title);
    setBody(entry.body);
    setShowForm(true);
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
          <p className="text-slate-500">Loading journal...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Journal</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <p className="text-slate-500 text-sm">Private tier — not visible to coaches or staff through this platform</p>
            </div>
            <p className="text-xs text-amber-600 mt-2">
              Note: Staff who are mandatory reporters under Title IX or state law may have reporting obligations if they become aware of disclosures of sexual violence, abuse, or harm to minors through any channel.
            </p>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Entry
            </Button>
          )}
        </div>

        {/* Create/Edit form */}
        {showForm && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50/30">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{editingId ? "Edit Entry" : "New Journal Entry"}</CardTitle>
                <button onClick={resetForm} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="What's on your mind?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Entry</Label>
                <Textarea
                  placeholder="Write your thoughts..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!title.trim() || !body.trim() || saving}>
                  {saving ? "Saving..." : editingId ? "Update" : "Save Entry"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entries list */}
        {entries.length === 0 && !showForm ? (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-slate-900 mb-2">Your journal is empty</h2>
              <p className="text-slate-500 mb-6">
                Start writing to process your thoughts. Everything here is completely private.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Write Your First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const preview = entry.body.length > 150 ? entry.body.substring(0, 150) + "..." : entry.body;
              const date = new Date(entry.created_at);

              return (
                <Card key={entry.id}>
                  <CardContent className="py-4">
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-medium text-slate-900">{entry.title}</h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                          {!isExpanded && (
                            <p className="text-sm text-slate-500 mt-2">{preview}</p>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.body}</p>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => startEdit(entry)}>
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(entry.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                            Delete
                          </Button>
                        </div>
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
