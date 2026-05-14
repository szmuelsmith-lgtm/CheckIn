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

interface SidebarProps { role: UserRole; userName: string; dark?: boolean; }

export function Sidebar({ role, userName, dark }: SidebarProps) {
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
      <div
        className="px-5 py-5"
        style={{ borderBottom: `1px solid ${dark ? "#21262d" : "#f1f5f9"}` }}
      >
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
            <p
              className="font-bold text-[15px] tracking-tight"
              style={{ color: dark ? "#e6edf3" : "#0f172a" }}
            >
              Check-In
            </p>
            <p
              className="text-[10px] tracking-widest uppercase mt-0.5"
              style={{ color: dark ? "#6e7681" : "#94a3b8" }}
            >
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
                color: dark ? "#8b949e" : "#64748b",
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
      <div
        className="p-4"
        style={{ borderTop: `1px solid ${dark ? "#21262d" : "#f1f5f9"}` }}
      >
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
            <p
              className="text-[13px] font-semibold truncate"
              style={{ color: dark ? "#e6edf3" : "#334155" }}
            >
              {userName}
            </p>
            <p
              className="text-[11px]"
              style={{ color: dark ? "#6e7681" : "#94a3b8" }}
            >
              {roleLabel}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-colors shrink-0"
            style={{ color: dark ? "#6e7681" : "#94a3b8" }}
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
      {/* Mobile header bar — staff roles only (athletes use DashboardLayout's header) */}
      {!isAthlete && (
        <header
          className="fixed top-0 left-0 right-0 z-50 lg:hidden"
          style={{
            background: dark ? "rgba(13,17,23,0.95)" : "rgba(255,255,255,0.95)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderBottom: `1px solid ${dark ? "#21262d" : "#f1f5f9"}`,
            boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <div
            className="flex items-center justify-between px-4 h-14"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl -ml-2"
              style={{ color: dark ? "#8b949e" : "#64748b" }}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo + app name */}
            <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
              <div
                className="h-7 w-7 rounded-[9px] flex items-center justify-center shrink-0"
                style={{
                  background: "linear-gradient(135deg, #065f46, #059669)",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                }}
              >
                <Anchor className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
              </div>
              <div className="leading-none">
                <p
                  className="font-bold text-[15px] tracking-tight"
                  style={{ color: dark ? "#e6edf3" : "#0f172a" }}
                >
                  Check-In
                </p>
              </div>
            </div>

            {/* User avatar */}
            <div
              className="h-8 w-8 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, #d1fae5, #a7f3d0)",
                boxShadow: "0 1px 4px rgba(5,150,105,0.15)",
              }}
            >
              <span className="text-[13px] font-bold" style={{ color: "#047857" }}>
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </header>
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
          "fixed left-0 z-40 transition-transform duration-200 w-64",
          // Non-athlete: on mobile the aside starts below the header (accounts for safe-area); full height on desktop
          isAthlete
            ? "top-0 h-full"
            : "top-[calc(3.5rem+env(safe-area-inset-top,0px))] h-[calc(100%-3.5rem-env(safe-area-inset-top,0px))] lg:top-0 lg:h-full",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        style={{
          background: dark ? "#0d1117" : "#ffffff",
          borderRight: `1px solid ${dark ? "#21262d" : "#f1f5f9"}`,
          boxShadow: "2px 0 16px rgba(0,0,0,0.04)",
        }}
      >
        {nav}
      </aside>
    </>
  );
}
