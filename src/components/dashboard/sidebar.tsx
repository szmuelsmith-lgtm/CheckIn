"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  Heart,
  Settings,
  Users,
  AlertTriangle,
  ListChecks,
  FolderOpen,
  Menu,
  X,
  LogOut,
  Shield,
  Lock,
} from "lucide-react";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  athlete: [
    { label: "Dashboard", href: "/athlete/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Check-In", href: "/athlete/checkin", icon: <ClipboardCheck className="h-5 w-5" /> },
    { label: "Journal", href: "/athlete/journal", icon: <BookOpen className="h-5 w-5" /> },
    { label: "Trends", href: "/athlete/trends", icon: <TrendingUp className="h-5 w-5" /> },
    { label: "Resources", href: "/athlete/resources", icon: <Heart className="h-5 w-5" /> },
    { label: "Preferences", href: "/athlete/preferences", icon: <Settings className="h-5 w-5" /> },
    { label: "Privacy & Sharing", href: "/athlete/privacy", icon: <Lock className="h-5 w-5" /> },
  ],
  coach: [
    { label: "Dashboard", href: "/coach/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Team Pulse", href: "/coach/athletes", icon: <Users className="h-5 w-5" /> },
    { label: "Support Info", href: "/coach/followups", icon: <Shield className="h-5 w-5" /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Teams", href: "/admin/teams", icon: <Users className="h-5 w-5" /> },
    { label: "Alerts", href: "/admin/alerts", icon: <AlertTriangle className="h-5 w-5" /> },
    { label: "Follow-ups", href: "/admin/followups", icon: <ListChecks className="h-5 w-5" /> },
    { label: "Resources", href: "/admin/resources", icon: <FolderOpen className="h-5 w-5" /> },
    { label: "Audit Logs", href: "/admin/audit-logs", icon: <Shield className="h-5 w-5" /> },
  ],
  support: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Alerts", href: "/admin/alerts", icon: <AlertTriangle className="h-5 w-5" /> },
    { label: "Follow-ups", href: "/admin/followups", icon: <ListChecks className="h-5 w-5" /> },
  ],
  psychiatrist: [
    { label: "Dashboard", href: "/psychiatrist/dashboard", icon: <Users className="h-5 w-5" /> },
  ],
  trusted_adult: [
    { label: "Dashboard", href: "/psychiatrist/dashboard", icon: <Users className="h-5 w-5" /> },
  ],
};

interface SidebarProps {
  role: UserRole;
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const items = NAV_ITEMS[role] || [];

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const roleLabel =
    role === "athlete" ? "Athlete" :
    role === "coach" ? "Coach" :
    role === "admin" ? "Admin" :
    role === "psychiatrist" ? "Counselor" :
    role === "trusted_adult" ? "Trusted Adult" : "Support";

  const nav = (
    <nav className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-emerald-500" />
          <span className="font-semibold text-lg text-slate-900">Check-In</span>
        </div>
        <p className="text-xs text-slate-500 mt-1">{roleLabel} Portal</p>
      </div>

      {/* Nav Items */}
      <div className="flex-1 py-4 px-3 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-slate-500">{roleLabel}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
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
      {/* Mobile toggle — hidden for athletes (they use bottom tab bar) */}
      {!isAthlete && (
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200 lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* Mobile overlay */}
      {mobileOpen && !isAthlete && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-40 transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {nav}
      </aside>
    </>
  );
}
