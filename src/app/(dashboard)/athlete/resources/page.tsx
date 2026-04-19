"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { createClient } from "@/lib/supabase/client";
import {
  ExternalLink, Heart, Phone, BookOpen,
  Sparkles, AlertTriangle,
} from "lucide-react";

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
}

const CATEGORY_CONFIG: Record<string, {
  label: string;
  activeBg: string;
  activeColor: string;
  cardBg: string;
  cardBorder: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}> = {
  crisis: {
    label: "Crisis",
    activeBg: "#fef2f2",
    activeColor: "#dc2626",
    cardBg: "#fef2f2",
    cardBorder: "#fecaca",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    icon: Phone,
  },
  counseling: {
    label: "Counseling",
    activeBg: "#f0fdfa",
    activeColor: "#0d9488",
    cardBg: "#f0fdfa",
    cardBorder: "#99f6e4",
    iconBg: "#ccfbf1",
    iconColor: "#0d9488",
    icon: Heart,
  },
  wellness: {
    label: "Wellness",
    activeBg: "#f0fdf4",
    activeColor: "#059669",
    cardBg: "#f0fdf4",
    cardBorder: "#bbf7d0",
    iconBg: "#d1fae5",
    iconColor: "#059669",
    icon: Sparkles,
  },
  other: {
    label: "Other",
    activeBg: "#f8fafc",
    activeColor: "#475569",
    cardBg: "#f8fafc",
    cardBorder: "#e2e8f0",
    iconBg: "#e2e8f0",
    iconColor: "#475569",
    icon: BookOpen,
  },
};

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
      if (resourceData) {
        const crisisUrls   = new Set(CRISIS_RESOURCES.map(cr => cr.url.toLowerCase()));
        const crisisTitles = new Set(CRISIS_RESOURCES.map(cr => cr.title.toLowerCase()));
        const seen = new Set<string>();
        setResources(
          resourceData
            .filter((r: Resource) => r.category !== "academic")
            .filter((r: Resource) => !crisisUrls.has(r.url.toLowerCase()) && !crisisTitles.has(r.title.toLowerCase()))
            .filter((r: Resource) => {
              const key = r.title.toLowerCase();
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
        );
      }
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
          <div className="h-5 w-5 rounded-full border-2 animate-spin"
               style={{ borderColor: T.border, borderTopColor: T.green }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="athlete" userName={profile?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-[26px] font-bold tracking-tight" style={{ color: T.text }}>Resources</h1>
          <p className="text-[14px] mt-0.5" style={{ color: T.textMuted }}>Support available through your program and beyond.</p>
        </div>

        {/* Crisis banner — always visible */}
        <div
          className="rounded-3xl p-5 animate-fade-in-up"
          style={{ background: "linear-gradient(135deg, #991b1b, #dc2626)", boxShadow: "0 4px 20px rgba(220,38,38,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center"
                 style={{ background: "rgba(255,255,255,0.15)" }}>
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
            <span className="text-[13px] font-bold text-white uppercase tracking-wide">Crisis Support</span>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {CRISIS_RESOURCES.map(r => (
              <a
                key={r.id}
                href={r.url}
                className="rounded-2xl p-3 text-center block transition-all active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <p className="text-[20px] font-bold text-white">{r.number}</p>
                <p className="text-[10px] mt-0.5 leading-tight" style={{ color: "rgba(255,255,255,0.75)" }}>{r.title}</p>
              </a>
            ))}
          </div>
          <p className="text-[11px] mt-3" style={{ color: "rgba(255,255,255,0.6)" }}>Free · Confidential · 24/7</p>
        </div>

        {/* Category filter */}
        {resources.length > 0 && (
          <div className="flex gap-2 flex-wrap animate-fade-in">
            {categories.map(cat => {
              const isActive = filterCategory === cat;
              const cfg = cat !== "all" ? CATEGORY_CONFIG[cat] : null;
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3 py-1.5 text-[12px] font-semibold rounded-full transition-all"
                  style={isActive
                    ? {
                        background: cfg ? cfg.activeBg : T.raised,
                        color: cfg ? cfg.activeColor : T.textSub,
                        border: `1px solid ${cfg ? cfg.cardBorder : T.border}`,
                      }
                    : {
                        background: T.surface,
                        color: T.textMuted,
                        border: `1px solid ${T.border}`,
                      }
                  }
                >
                  {cat === "all" ? "All Resources" : (cfg?.label || cat)}
                </button>
              );
            })}
          </div>
        )}

        {/* Resource cards */}
        {resources.length === 0 ? (
          <div className="rounded-3xl p-12 text-center"
               style={{ background: T.surface, border: `2px dashed ${T.border}` }}>
            <Heart className="h-7 w-7 mx-auto mb-3" style={{ color: T.border }} />
            <p className="text-[15px] font-semibold mb-1" style={{ color: T.text }}>No resources added yet</p>
            <p className="text-[13px]" style={{ color: T.textMuted }}>Resources will be added by your program administrators.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl p-10 text-center"
               style={{ background: T.surface, border: `2px dashed ${T.border}` }}>
            <p className="text-[14px]" style={{ color: T.textMuted }}>No resources in this category.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((resource, i) => {
              const cfg = CATEGORY_CONFIG[resource.category] || CATEGORY_CONFIG.other;
              const Icon = cfg.icon;
              return (
                <a
                  key={resource.id}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-4 rounded-3xl border transition-all active:scale-[0.99] animate-fade-in-up group"
                  style={{
                    background: cfg.cardBg,
                    borderColor: cfg.cardBorder,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                    animationDelay: `${i * 40}ms`,
                  }}
                >
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5"
                       style={{ background: cfg.iconBg, color: cfg.iconColor }}>
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[14px] leading-snug" style={{ color: T.text }}>{resource.title}</p>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 transition-colors" style={{ color: T.textMuted }} />
                    </div>
                    <p className="text-[12px] mt-1 leading-relaxed line-clamp-2" style={{ color: T.textMuted }}>{resource.description}</p>
                    <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: cfg.iconBg, color: cfg.iconColor }}>
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
