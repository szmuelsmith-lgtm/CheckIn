"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "./sidebar";
import { AthleteTabBar } from "./athlete-tab-bar";
import { InstallPrompt } from "./install-prompt";
import { UserRole } from "@/types/database";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  /** Hint role from page — used only until real role loads from DB */
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
        .from("profiles")
        .select("role, full_name")
        .eq("auth_user_id", user.id)
        .single();

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
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar role={verifiedRole} userName={verifiedName} />

      {/* Mobile header for athletes */}
      {isAthlete && (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-b border-slate-200/60 lg:hidden">
          <div className="flex items-center justify-between px-5 h-14">
            <span className="font-bold text-lg text-slate-900 tracking-tight">Check-In</span>
            <div className="flex items-center gap-1">
              <Link
                href="/athlete/preferences"
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Preferences"
              >
                <Settings className="h-5 w-5" />
              </Link>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className={`lg:ml-64 min-h-screen ${isAthlete ? "pb-20 lg:pb-0" : ""}`}>
        <div className={`p-5 lg:p-8 ${isAthlete ? "pt-[4.5rem] lg:pt-8" : "pt-16 lg:pt-8"} max-w-7xl mx-auto`}>
          {children}
        </div>
      </main>

      {isAthlete && <AthleteTabBar />}
      {isAthlete && <InstallPrompt />}
    </div>
  );
}
