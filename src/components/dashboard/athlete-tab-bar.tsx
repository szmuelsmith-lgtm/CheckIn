"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ClipboardCheck, BookOpen, TrendingUp, Heart, Lock } from "lucide-react";

const TABS = [
  { label: "Home",     href: "/athlete/dashboard", icon: LayoutDashboard },
  { label: "Check-In", href: "/athlete/checkin",   icon: ClipboardCheck  },
  { label: "Journal",  href: "/athlete/journal",   icon: BookOpen        },
  { label: "Trends",   href: "/athlete/trends",    icon: TrendingUp      },
  { label: "Help",     href: "/athlete/resources", icon: Heart           },
  { label: "Privacy",  href: "/athlete/privacy",   icon: Lock            },
];

export function AthleteTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: "rgba(255,255,255,0.97)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderTop: "1px solid #e2e8f0",
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center h-[60px] max-w-lg mx-auto px-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-opacity active:opacity-70"
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200"
                style={isActive ? {
                  background: "#f0fdf4",
                  boxShadow: "inset 0 0 0 1px rgba(4,120,87,0.2)",
                } : {}}
              >
                <Icon
                  className={cn("h-[18px] w-[18px]")}
                  style={{ color: isActive ? "#047857" : "#94a3b8" }}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span
                className="text-[9px] font-semibold tracking-wide transition-colors"
                style={{ color: isActive ? "#047857" : "#94a3b8" }}
              >
                {tab.label.toUpperCase()}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
