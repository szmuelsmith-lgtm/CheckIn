"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { ExternalLink, Heart, Phone, BookOpen, GraduationCap, Sparkles } from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; badge: string; icon: React.ReactNode }> = {
  crisis: {
    label: "Crisis",
    badge: "bg-red-100 text-red-700 border-red-200",
    icon: <Phone className="h-5 w-5 text-red-500" />,
  },
  counseling: {
    label: "Counseling",
    badge: "bg-teal-100 text-teal-700 border-teal-200",
    icon: <Heart className="h-5 w-5 text-teal-500" />,
  },
  academic: {
    label: "Academic",
    badge: "bg-purple-100 text-purple-700 border-purple-200",
    icon: <GraduationCap className="h-5 w-5 text-purple-500" />,
  },
  wellness: {
    label: "Wellness",
    badge: "bg-green-100 text-green-700 border-green-200",
    icon: <Sparkles className="h-5 w-5 text-green-500" />,
  },
  other: {
    label: "Other",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    icon: <BookOpen className="h-5 w-5 text-slate-500" />,
  },
};

export default function AthleteResourcesPage() {
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, organization_id")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) setProfile(prof);

      const { data: resourceData } = await supabase
        .from("resources")
        .select("id, title, description, category, url")
        .order("category")
        .order("title");

      if (resourceData) setResources(resourceData);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filterCategory === "all"
    ? resources
    : resources.filter((r) => r.category === filterCategory);

  const categories = ["all", ...Array.from(new Set(resources.map((r) => r.category)))];

  if (loading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading resources...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
          <p className="text-slate-500 mt-1">
            Support resources available through your program
          </p>
        </div>

        {/* Crisis banner */}
        <Card className="mb-6 bg-red-50 border-red-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-red-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  In a crisis? Call or text 988 (Suicide & Crisis Lifeline)
                </p>
                <p className="text-xs text-red-600 mt-0.5">
                  Free, confidential, 24/7 support
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category filter */}
        {resources.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  filterCategory === cat
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat === "all" ? "All" : CATEGORY_CONFIG[cat]?.label || cat}
              </button>
            ))}
          </div>
        )}

        {/* Resource cards */}
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-slate-900">No resources available</p>
              <p className="text-slate-500 mt-1">
                Resources will be added by your program administrators.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((resource) => {
              const config = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.other;
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">{config.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-slate-900 text-sm truncate">
                              {resource.title}
                            </h3>
                            <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">
                            {resource.description}
                          </p>
                          <Badge variant="outline" className={`mt-2 ${config.badge}`}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
