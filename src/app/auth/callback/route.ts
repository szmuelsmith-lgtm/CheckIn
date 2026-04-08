import { createServerSupabaseClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Get user profile to determine role-based redirect
      const { data: { user } } = await supabase.auth.getUser();
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
          return NextResponse.redirect(
            `${origin}${redirectMap[profile.role] || "/athlete/dashboard"}`
          );
        }
      }
      return NextResponse.redirect(`${origin}/athlete/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
