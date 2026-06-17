"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardCheck, BookOpen, TrendingUp, Heart } from "lucide-react";

const TABS = [
  { label: "Home",     href: "/athlete/dashboard", icon: LayoutDashboard },
  { label: "Trends",   href: "/athlete/trends",    icon: TrendingUp      },
  { label: "Check-In", href: "/athlete/checkin",   icon: ClipboardCheck,  cta: true },
  { label: "Journal",  href: "/athlete/journal",   icon: BookOpen        },
  { label: "Help",     href: "/athlete/resources", icon: Heart           },
];

export function AthleteTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        boxShadow: "0 -1px 0 rgba(0,0,0,0.06), 0 -4px 24px rgba(0,0,0,0.04)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
      role="tablist"
      aria-label="Main navigation"
    >
      <div
        className="flex items-center max-w-lg mx-auto px-3"
        style={{ height: "60px" }}
      >
        {TABS.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/");
          const Icon = tab.icon;

          if (tab.cta) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center flex-1 gap-1.5 active:scale-95 transition-transform duration-150"
              >
                <div
                  className="h-11 w-11 rounded-[18px] flex items-center justify-center"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, #065f46, #059669)"
                      : "linear-gradient(135deg, #047857, #10b981)",
                    boxShadow: "0 4px 14px rgba(5,150,105,0.38)",
                  }}
                >
                  <Icon className="h-5 w-5 text-white" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-bold tracking-wide" style={{ color: "#059669" }}>
                  CHECK-IN
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center flex-1 py-2 gap-1 active:opacity-60 transition-opacity"
            >
              <div
                className="flex items-center justify-center w-9 h-9 rounded-2xl transition-all duration-200"
                style={
                  isActive
                    ? { background: "#ecfdf5", boxShadow: "0 1px 4px rgba(5,150,105,0.15)" }
                    : {}
                }
              >
                <Icon
                  className="h-[18px] w-[18px]"
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
