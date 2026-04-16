"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink, Heart, Phone, BookOpen,
  Sparkles, AlertTriangle,
} from "lucide-react";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;
}

const CATEGORY_CONFIG: Record<string, {
  label: string;
  filterBg: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}> = {
  crisis: {
    label: "Crisis",
    filterBg: "bg-red-600 text-white",
    cardBg: "bg-red-50",
    cardBorder: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    icon: Phone,
  },
  counseling: {
    label: "Counseling",
    filterBg: "bg-teal-600 text-white",
    cardBg: "bg-teal-50",
    cardBorder: "border-teal-200",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    icon: Heart,
  },
  wellness: {
    label: "Wellness",
    filterBg: "bg-emerald-600 text-white",
    cardBg: "bg-emerald-50",
    cardBorder: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    icon: Sparkles,
  },
  other: {
    label: "Other",
    filterBg: "bg-slate-600 text-white",
    cardBg: "bg-slate-50",
    cardBorder: "border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
    icon: BookOpen,
  },
};

// Built-in always-visible crisis resources
const CRISIS_RESOURCES = [
  {
    id: "_988",
    title: "988 Suicide & Crisis Lifeline",
    description: "Free, confidential support 24/7. Call or text 988 anytime.",
    number: "988",
    url: "tel:988",
  },
  {
    id: "_crisis_text",
    title: "Crisis Text Line",
    description: "Text HOME to 741741 for free crisis support via text.",
    number: "741741",
    url: "sms:741741",
  },
  {
    id: "_911",
    title: "Emergency Services",
    description: "If you are in immediate danger, call 911.",
    number: "911",
    url: "tel:911",
  },
];

export default function AthleteResourcesPage() {
  const [profile, setProfile]           = useState<{ full_name: string } | null>(null);
  const [resources, setResources]       = useState<Resource[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: prof } = await supabase
        .from("profiles").select("full_name, organization_id").eq("auth_user_id", user.id).single();
      if (prof) setProfile(prof);
      const { data: resourceData } = await supabase
        .from("resources").select("id, title, description, category, url")
        .order("category").order("title");
      if (resourceData) setResources(resourceData.filter((r: Resource) => r.category !== "academic"));
      setLoading(false);
    }
    load();
  }, []);

  const filtered = filterCategory === "all"
    ? resources
    : resources.filter(r => r.category === filterCategory);

  const categories = ["all", ...Array.from(new Set(resources.map(r => r.category)))];

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
          <h1 className="text-[26px] font-bold text-slate-900 tracking-tight">Resources</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">Support available through your program and beyond.</p>
        </div>

        {/* Crisis banner — always visible */}
        <div className="bg-red-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[13px] font-bold uppercase tracking-wide">Crisis Support</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {CRISIS_RESOURCES.map(r => (
              <a
                key={r.id}
                href={r.url}
                className="bg-white/15 hover:bg-white/25 rounded-xl p-3 transition-colors text-center block"
              >
                <p className="text-[18px] font-bold">{r.number}</p>
                <p className="text-[11px] text-red-100 mt-0.5 leading-tight">{r.title}</p>
              </a>
            ))}
          </div>
          <p className="text-[11px] text-red-200 mt-3">Free · Confidential · 24/7</p>
        </div>

        {/* Category filter */}
        {resources.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => {
              const isActive = filterCategory === cat;
              const cfg = cat !== "all" ? CATEGORY_CONFIG[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 text-[12px] font-semibold rounded-full border transition-all ${
                    isActive
                      ? (cfg ? cfg.filterBg + " border-transparent" : "bg-slate-700 text-white border-transparent")
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {cat === "all" ? "All Resources" : (cfg?.label || cat)}
                </button>
              );
            })}
          </div>
        )}

        {/* Resource cards */}
        {resources.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Heart className="h-7 w-7 text-slate-300 mx-auto mb-3" />
            <p className="text-[15px] font-medium text-slate-700 mb-1">No resources added yet</p>
            <p className="text-[13px] text-slate-500">Resources will be added by your program administrators.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <p className="text-[14px] text-slate-500">No resources in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(resource => {
              const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.other;
              const Icon = cfg.icon;
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-start gap-3 p-4 rounded-2xl border ${cfg.cardBg} ${cfg.cardBorder} hover:shadow-sm transition-shadow group`}
                >
                  <div className={`h-9 w-9 rounded-xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[14px] text-slate-900 leading-snug">{resource.title}</p>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5 group-hover:text-slate-600 transition-colors" />
                    </div>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed line-clamp-2">{resource.description}</p>
                    <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${cfg.iconBg} ${cfg.iconColor}`}>
                      {cfg.label}
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
