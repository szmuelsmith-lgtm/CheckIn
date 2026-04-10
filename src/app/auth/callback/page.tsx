"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient();

      // Exchange the code in the URL for a session
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          router.replace("/login?error=auth");
          return;
        }
      }

      // Get profile role and redirect accordingly
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("auth_user_id", user.id)
          .single();

        if (profile) {
          const redirectMap: Record<string, string> = {
            athlete: "/athlete/dashboard",
            coach: "/coach/dashboard",
            admin: "/admin/dashboard",
            support: "/admin/dashboard",
          };
          router.replace(redirectMap[profile.role] || "/athlete/dashboard");
          return;
        }
      }

      router.replace("/athlete/dashboard");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <p className="text-slate-500 text-sm">Signing you in…</p>
    </div>
  );
}
