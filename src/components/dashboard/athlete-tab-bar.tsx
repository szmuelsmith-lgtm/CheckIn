"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardCheck,
  BookOpen,
  TrendingUp,
  Heart,
} from "lucide-react";

const TABS = [
  { label: "Home", href: "/athlete/dashboard", icon: LayoutDashboard },
  { label: "Check-In", href: "/athlete/checkin", icon: ClipboardCheck },
  { label: "Journal", href: "/athlete/journal", icon: BookOpen },
  { label: "Trends", href: "/athlete/trends", icon: TrendingUp },
  { label: "Help", href: "/athlete/resources", icon: Heart },
];

export function AthleteTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 lg:hidden safe-area-bottom"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 py-1 rounded-lg transition-colors",
                isActive
                  ? "text-emerald-600"
                  : "text-slate-400 active:text-slate-600"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-emerald-600")} strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-[10px] font-medium",
                isActive ? "text-emerald-600" : "text-slate-400"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-emerald-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
