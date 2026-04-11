import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { UserRole } from "@/types/database";

// Which roles are allowed on which path prefixes
const ROLE_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/athlete",      roles: ["athlete"] },
  { prefix: "/coach",        roles: ["coach"] },
  { prefix: "/admin",        roles: ["admin", "support"] },
  { prefix: "/psychiatrist", roles: ["psychiatrist", "trusted_adult"] },
];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Public paths — no auth required
  const publicPaths = ["/", "/login", "/signup", "/privacy", "/terms", "/compliance", "/accessibility", "/offline"];
  const isPublicPath =
    publicPaths.includes(path) ||
    path.startsWith("/auth/") ||
    path.startsWith("/_next/") ||
    path.startsWith("/api/");

  // Not logged in — redirect to login
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Logged in — check role-based access for dashboard routes
  if (user) {
    const matchedRule = ROLE_ROUTES.find((r) => path.startsWith(r.prefix));
    if (matchedRule) {
      // Fetch profile role from DB (server-side, cannot be spoofed)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("auth_user_id", user.id)
        .single();

      const role = profile?.role as UserRole | undefined;

      if (!role || !matchedRule.roles.includes(role)) {
        // Wrong role — redirect to their own dashboard
        const url = request.nextUrl.clone();
        if (role === "athlete")       url.pathname = "/athlete/dashboard";
        else if (role === "coach")    url.pathname = "/coach/dashboard";
        else if (role === "admin" || role === "support") url.pathname = "/admin/dashboard";
        else if (role === "psychiatrist" || role === "trusted_adult") url.pathname = "/psychiatrist/dashboard";
        else                          url.pathname = "/login";
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
