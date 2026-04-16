"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";
import {
  LayoutDashboard, ClipboardCheck, BookOpen, TrendingUp, Heart,
  Settings, Users, AlertTriangle, ListChecks, FolderOpen,
  Menu, X, LogOut, Shield, Lock, Anchor, ScrollText,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem { label: string; href: string; icon: React.ReactNode; }

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  athlete: [
    { label: "Dashboard",      href: "/athlete/dashboard",   icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Check-In",       href: "/athlete/checkin",     icon: <ClipboardCheck  className="h-5 w-5" /> },
    { label: "Journal",        href: "/athlete/journal",     icon: <BookOpen        className="h-5 w-5" /> },
    { label: "Trends",         href: "/athlete/trends",      icon: <TrendingUp      className="h-5 w-5" /> },
    { label: "Resources",      href: "/athlete/resources",   icon: <Heart           className="h-5 w-5" /> },
    { label: "Preferences",    href: "/athlete/preferences", icon: <Settings        className="h-5 w-5" /> },
    { label: "Privacy & Sharing", href: "/athlete/privacy",  icon: <Lock            className="h-5 w-5" /> },
  ],
  coach: [
    { label: "Dashboard",   href: "/coach/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Team Pulse",  href: "/coach/athletes",  icon: <Users           className="h-5 w-5" /> },
    { label: "Support Info",href: "/coach/followups", icon: <Shield          className="h-5 w-5" /> },
  ],
  admin: [
    { label: "Dashboard",  href: "/admin/dashboard",   icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Teams",      href: "/admin/teams",        icon: <Users           className="h-5 w-5" /> },
    { label: "Alerts",     href: "/admin/alerts",       icon: <AlertTriangle   className="h-5 w-5" /> },
    { label: "Follow-ups", href: "/admin/followups",    icon: <ListChecks      className="h-5 w-5" /> },
    { label: "Resources",  href: "/admin/resources",    icon: <FolderOpen      className="h-5 w-5" /> },
    { label: "Audit Logs", href: "/admin/audit-logs",   icon: <ScrollText      className="h-5 w-5" /> },
  ],
  support: [
    { label: "Dashboard",  href: "/admin/dashboard",  icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Alerts",     href: "/admin/alerts",      icon: <AlertTriangle   className="h-5 w-5" /> },
    { label: "Follow-ups", href: "/admin/followups",   icon: <ListChecks      className="h-5 w-5" /> },
  ],
  psychiatrist: [
    { label: "Dashboard",  href: "/psychiatrist/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Teams",      href: "/admin/teams",            icon: <Users           className="h-5 w-5" /> },
    { label: "Alerts",     href: "/admin/alerts",           icon: <AlertTriangle   className="h-5 w-5" /> },
    { label: "Follow-ups", href: "/admin/followups",        icon: <ListChecks      className="h-5 w-5" /> },
    { label: "Resources",  href: "/admin/resources",        icon: <FolderOpen      className="h-5 w-5" /> },
    { label: "Audit Logs", href: "/admin/audit-logs",       icon: <ScrollText      className="h-5 w-5" /> },
  ],
  trusted_adult: [
    { label: "Dashboard", href: "/psychiatrist/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  ],
};

interface SidebarProps { role: UserRole; userName: string; }

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname  = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router    = useRouter();
  const items     = NAV_ITEMS[role] || [];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const roleLabel =
    role === "athlete"       ? "Athlete" :
    role === "coach"         ? "Coach" :
    role === "admin"         ? "Admin" :
    role === "psychiatrist"  ? "Counselor" :
    role === "trusted_adult" ? "Trusted Adult" : "Support";

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl flex items-center justify-center shrink-0"
               style={{ background: "linear-gradient(135deg,#065f46,#047857)" }}>
            <Anchor className="h-4 w-4 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <p className="font-bold text-[15px] tracking-tight" style={{ color: "#0f172a" }}>Check-In</p>
            <p className="text-[10px] tracking-widest uppercase mt-0.5" style={{ color: "#64748b" }}>{roleLabel} Portal</p>
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150",
              )}
              style={isActive ? {
                background: "linear-gradient(135deg,#ecfdf5,#d1fae5)",
                color: "#047857",
                boxShadow: "inset 0 0 0 1px rgba(4,120,87,0.2)",
              } : {
                color: "#64748b",
              }}
            >
              <span className="shrink-0" style={{ opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="p-4" style={{ borderTop: "1px solid #e2e8f0" }}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
               style={{ background: "#d1fae5" }}>
            <span className="text-[13px] font-bold" style={{ color: "#047857" }}>{userName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate" style={{ color: "#334155" }}>{userName}</p>
            <p className="text-[11px]" style={{ color: "#64748b" }}>{roleLabel}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-lg transition-colors shrink-0"
            style={{ color: "#64748b" }}
            title="Sign out"
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
          className="fixed top-4 left-4 z-50 p-2 rounded-lg lg:hidden"
          style={{ background: "#ffffff", border: "1px solid #e2e8f0", color: "#334155" }}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {mobileOpen && !isAthlete && (
        <div className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.6)" }}
             onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 z-40 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{ background: "#ffffff", borderRight: "1px solid #e2e8f0" }}
      >
        {nav}
      </aside>
    </>
  );
}
