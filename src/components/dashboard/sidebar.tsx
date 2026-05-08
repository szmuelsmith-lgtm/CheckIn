"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";
import {
  LayoutDashboard, ClipboardCheck, BookOpen, TrendingUp, Heart,
  Settings, Users, AlertTriangle, ListChecks, FolderOpen,
  Menu, X, LogOut, Shield, Lock, Anchor, ScrollText, UserCircle,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem { label: string; href: string; icon: React.ReactNode; }

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  athlete: [
    { label: "Dashboard",         href: "/athlete/dashboard",   icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Check-In",          href: "/athlete/checkin",     icon: <ClipboardCheck  className="h-4 w-4" /> },
    { label: "Journal",           href: "/athlete/journal",     icon: <BookOpen        className="h-4 w-4" /> },
    { label: "Trends",            href: "/athlete/trends",      icon: <TrendingUp      className="h-4 w-4" /> },
    { label: "Resources",         href: "/athlete/resources",   icon: <Heart           className="h-4 w-4" /> },
    { label: "Preferences",       href: "/athlete/preferences", icon: <Settings        className="h-4 w-4" /> },
    { label: "Privacy & Sharing", href: "/athlete/privacy",     icon: <Lock            className="h-4 w-4" /> },
    { label: "Account",          href: "/athlete/account",     icon: <UserCircle      className="h-4 w-4" /> },
  ],
  coach: [
    { label: "Dashboard",   href: "/coach/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Team Pulse",  href: "/coach/athletes",  icon: <Users           className="h-4 w-4" /> },
    { label: "Support Info",href: "/coach/followups", icon: <Shield          className="h-4 w-4" /> },
  ],
  admin: [
    { label: "Dashboard",  href: "/admin/dashboard",  icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Teams",      href: "/admin/teams",       icon: <Users           className="h-4 w-4" /> },
    { label: "Alerts",     href: "/admin/alerts",      icon: <AlertTriangle   className="h-4 w-4" /> },
    { label: "Follow-ups", href: "/admin/followups",   icon: <ListChecks      className="h-4 w-4" /> },
    { label: "Resources",  href: "/admin/resources",   icon: <FolderOpen      className="h-4 w-4" /> },
    { label: "Audit Logs", href: "/admin/audit-logs",  icon: <ScrollText      className="h-4 w-4" /> },
  ],
  support: [
    { label: "Dashboard",  href: "/admin/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Alerts",     href: "/admin/alerts",     icon: <AlertTriangle   className="h-4 w-4" /> },
    { label: "Follow-ups", href: "/admin/followups",  icon: <ListChecks      className="h-4 w-4" /> },
  ],
  psychiatrist: [
    { label: "Dashboard",  href: "/psychiatrist/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: "Teams",      href: "/admin/teams",            icon: <Users           className="h-4 w-4" /> },
    { label: "Alerts",     href: "/admin/alerts",           icon: <AlertTriangle   className="h-4 w-4" /> },
    { label: "Follow-ups", href: "/admin/followups",        icon: <ListChecks      className="h-4 w-4" /> },
    { label: "Resources",  href: "/admin/resources",        icon: <FolderOpen      className="h-4 w-4" /> },
    { label: "Audit Logs", href: "/admin/audit-logs",       icon: <ScrollText      className="h-4 w-4" /> },
  ],
  trusted_adult: [
    { label: "Dashboard", href: "/psychiatrist/dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  ],
};

const ROLE_LABELS: Record<UserRole, string> = {
  athlete:       "Athlete",
  coach:         "Coach",
  admin:         "Admin",
  psychiatrist:  "Counselor",
  trusted_adult: "Trusted Adult",
  support:       "Support",
};

interface SidebarProps { role: UserRole; userName: string; }

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname     = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router       = useRouter();
  const items        = NAV_ITEMS[role] || [];
  const roleLabel    = ROLE_LABELS[role] || "User";

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="h-9 w-9 rounded-[12px] flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #065f46, #059669)",
              boxShadow: "0 3px 10px rgba(5,150,105,0.28)",
            }}
          >
            <Anchor className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <p className="font-bold text-[15px] tracking-tight" style={{ color: "#0f172a" }}>Check-In</p>
            <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: "#94a3b8" }}>
              {roleLabel} Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-2xl text-[13px] font-medium transition-all duration-150 min-h-[44px]",
              )}
              style={isActive ? {
                background: "linear-gradient(135deg, #ecfdf5, #d1fae5)",
                color: "#047857",
                boxShadow: "0 1px 4px rgba(5,150,105,0.12), inset 0 0 0 1px rgba(5,150,105,0.15)",
              } : {
                color: "#64748b",
              }}
            >
              <span className="shrink-0" style={{ opacity: isActive ? 1 : 0.55 }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="p-4" style={{ borderTop: "1px solid #f1f5f9" }}>
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
              boxShadow: "0 1px 4px rgba(5,150,105,0.15)",
            }}
          >
            <span className="text-[14px] font-bold" style={{ color: "#047857" }}>
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: "#334155" }}>{userName}</p>
            <p className="text-[11px]" style={{ color: "#94a3b8" }}>{roleLabel}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-colors shrink-0"
            style={{ color: "#94a3b8" }}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  );

  const isAthlete = role === "athlete";

  return (
    <>
      {!isAthlete && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-3 left-3 z-50 flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl lg:hidden"
          style={{
            background: "#ffffff",
            border: "1px solid #e8edf2",
            color: "#334155",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
          }}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {mobileOpen && !isAthlete && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(15,23,42,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-40 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: "#ffffff",
          borderRight: "1px solid #f1f5f9",
          boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
        }}
      >
        {nav}
      </aside>
    </>
  );
}
