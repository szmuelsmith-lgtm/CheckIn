"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, TrendingUp, Heart } from "lucide-react";

const LEFT_TABS = [
  { label: "Home",    href: "/athlete/dashboard", Icon: LayoutDashboard },
  { label: "Journal", href: "/athlete/journal",   Icon: BookOpen        },
];
const RIGHT_TABS = [
  { label: "Trends",  href: "/athlete/trends",    Icon: TrendingUp      },
  { label: "Help",    href: "/athlete/resources", Icon: Heart           },
];

export function AthleteTabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      aria-label="Main navigation"
    >
      <div
        className="flex items-center justify-around max-w-lg mx-auto px-2 relative"
        style={{
          height: 70,
          background: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.05), 0 -8px 28px rgba(31,38,135,0.07)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Left tabs */}
        {LEFT_TABS.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={active}
              aria-label={label}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <Icon
                className="h-[22px] w-[22px]"
                style={{ color: active ? "#5B8FF9" : "#C4C9D8" }}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? "#5B8FF9" : "#C4C9D8" }}
              >
                {label}
              </span>
            </Link>
          );
        })}

        {/* Center elevated + button */}
        <div className="flex flex-col items-center justify-end flex-1 h-full pb-2">
          <Link href="/athlete/checkin" aria-label="Start Check-In">
            <div
              className="flex items-center justify-center"
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                boxShadow: "0 8px 24px rgba(5,150,105,0.40), 0 2px 8px rgba(5,150,105,0.20)",
                marginBottom: 2,
                position: "relative",
                bottom: 14,
              }}
            >
              <span
                className="text-white select-none"
                style={{ fontSize: 28, lineHeight: 1, fontWeight: 300, marginTop: -1 }}
              >
                +
              </span>
            </div>
          </Link>
          <span
            className="text-[10px] font-semibold"
            style={{ color: "#059669", marginTop: -10 }}
          >
            Check-In
          </span>
        </div>

        {/* Right tabs */}
        {RIGHT_TABS.map(({ label, href, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              role="tab"
              aria-selected={active}
              aria-label={label}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full"
            >
              <Icon
                className="h-[22px] w-[22px]"
                style={{ color: active ? "#5B8FF9" : "#C4C9D8" }}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span
                className="text-[10px] font-semibold"
                style={{ color: active ? "#5B8FF9" : "#C4C9D8" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
