"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Trash2, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: "crisis", label: "Crisis" },
  { value: "counseling", label: "Counseling" },
  { value: "academic", label: "Academic" },
  { value: "wellness", label: "Wellness" },
  { value: "other", label: "Other" },
];

const CATEGORY_BADGE: Record<string, string> = {
  crisis: "bg-red-100 text-red-700 border-red-200",
  counseling: "bg-teal-100 text-teal-700 border-teal-200",
  academic: "bg-purple-100 text-purple-700 border-purple-200",
  wellness: "bg-green-100 text-green-700 border-green-200",
  other: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminResourcesPage() {
  const [profile, setProfile] = useState<{ full_name: string; id: string; role: string; organization_id: string | null } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formCategory, setFormCategory] = useState("wellness");
  const [formUrl, setFormUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const loadResources = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("resources")
      .select("*")
      .order("category")
      .order("title");
    if (data) setResources(data);
  };

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

      if (prof) setProfile(prof);
      await loadResources();
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async () => {
    if (!profile || !formTitle.trim() || !formUrl.trim()) return;
    setSaving(true);

    const supabase = createClient();
    await supabase.from("resources").insert({
      organization_id: profile.organization_id,
      title: formTitle.trim(),
      description: formDesc.trim(),
      category: formCategory,
      url: formUrl.trim(),
      created_by: profile.id,
    });

    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id,
      action: "create",
      target_type: "resource",
      metadata: { title: formTitle.trim(), category: formCategory },
    });

    await loadResources();
    setShowForm(false);
    setFormTitle("");
    setFormDesc("");
    setFormCategory("wellness");
    setFormUrl("");
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!profile) return;
    const supabase = createClient();
    await supabase.from("resources").delete().eq("id", id);

    await supabase.from("audit_logs").insert({
      actor_profile_id: profile.id,
      action: "delete",
      target_type: "resource",
      target_id: id,
    });

    setResources((prev) => prev.filter((r) => r.id !== id));
  };

  const roleName = profile?.role === "support" ? "Support" : "Admin";

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading resources...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={(profile?.role as "admin" | "support") || "admin"} userName={profile?.full_name || roleName}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
            <p className="text-slate-500 mt-1">
              Manage support resources visible to athletes
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? <X className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {showForm ? "Cancel" : "Add Resource"}
          </Button>
        </div>

        {/* Create form */}
        {showForm && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50/50">
            <CardHeader>
              <CardTitle className="text-lg">Add Resource</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="Resource name"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Brief description..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input
                    placeholder="https://..."
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={!formTitle.trim() || !formUrl.trim() || saving}>
                {saving ? "Saving..." : "Add Resource"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Resource list */}
        {resources.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium text-slate-900">No resources yet</p>
              <p className="text-slate-500 mt-1">Add resources that athletes can access for support.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {resources.map((resource) => (
              <Card key={resource.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{resource.title}</h3>
                        <Badge variant="outline" className={CATEGORY_BADGE[resource.category] || CATEGORY_BADGE.other}>
                          {resource.category}
                        </Badge>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-slate-500 mt-1">{resource.description}</p>
                      )}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-1"
                      >
                        {resource.url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50 shrink-0"
                      onClick={() => handleDelete(resource.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
