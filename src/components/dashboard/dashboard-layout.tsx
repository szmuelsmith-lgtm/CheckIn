"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { AthleteTabBar } from "./athlete-tab-bar";
import { InstallPrompt } from "./install-prompt";
import { UserRole } from "@/types/database";
import { Settings, LogOut, Anchor } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: UserRole;
  userName: string;
}

export function DashboardLayout({ children, role: hintRole, userName }: DashboardLayoutProps) {
  const router = useRouter();
  const [verifiedRole, setVerifiedRole] = useState<UserRole>(hintRole);
  const [verifiedName, setVerifiedName] = useState<string>(userName);

  useEffect(() => {
    async function loadRole() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles").select("role, full_name").eq("auth_user_id", user.id).single();
      if (!profile) { router.push("/login"); return; }
      setVerifiedRole(profile.role as UserRole);
      setVerifiedName(profile.full_name);
    }
    loadRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const isAthlete = verifiedRole === "athlete";

  return (
    <div style={{ background: "#f4f7f5", minHeight: "100%" }}>
      <Sidebar role={verifiedRole} userName={verifiedName} />

      {/* Mobile header — athletes only */}
      {isAthlete && (
        <header
          className="fixed top-0 left-0 right-0 z-40 lg:hidden"
          style={{
            background: "rgba(244,247,245,0.92)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            boxShadow: "0 1px 0 rgba(0,0,0,0.05), 0 2px 12px rgba(0,0,0,0.03)",
          }}
        >
          <div
            className="flex items-center justify-between px-5 h-14"
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="h-8 w-8 rounded-[10px] flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #065f46, #059669)",
                  boxShadow: "0 2px 8px rgba(5,150,105,0.3)",
                }}
              >
                <Anchor className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-[16px] tracking-tight" style={{ color: "#0f172a" }}>
                Check-In
              </span>
            </div>

            <div className="flex items-center gap-0.5">
              <Link
                href="/athlete/preferences"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-colors"
                style={{ color: "#94a3b8" }}
                aria-label="Preferences"
              >
                <Settings className="h-[18px] w-[18px]" />
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-xl transition-colors"
                style={{ color: "#94a3b8" }}
                aria-label="Sign out"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main
        className={`lg:ml-64 ${isAthlete ? "pb-[calc(76px+env(safe-area-inset-bottom,0px))] lg:pb-0" : ""}`}
        style={{ WebkitOverflowScrolling: "touch" }}
      >
        <div
          className={`p-5 lg:p-8 ${isAthlete
            ? "pt-[calc(3.5rem+env(safe-area-inset-top,0px)+20px)] lg:pt-8"
            : "pt-16 lg:pt-8"
          } max-w-7xl mx-auto`}
        >
          {children}
        </div>
      </main>

      {isAthlete && <AthleteTabBar />}
      {isAthlete && <InstallPrompt />}
    </div>
  );
}
