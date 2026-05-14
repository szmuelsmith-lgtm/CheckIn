/**
 * POST /api/dev/ensure-demo
 *
 * Uses the service-role admin client to create (or confirm) a single demo
 * account so that signInWithPassword always works without email verification.
 *
 * Body: { email: string; password: string; role: string; full_name: string }
 *
 * Safe to call from the client: it only operates on the hard-coded demo
 * email domain (@mailinator.com) and never returns auth tokens.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

const ALLOWED_DOMAIN = "mailinator.com";

export async function POST(request: NextRequest) {
  let body: { email: string; password: string; role: string; full_name: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, role, full_name } = body;

  // Only allow mailinator.com demo emails — never touch real accounts
  if (!email?.endsWith(`@${ALLOWED_DOMAIN}`)) {
    return NextResponse.json({ error: "Only mailinator.com demo accounts allowed" }, { status: 403 });
  }

  const service = createServiceSupabaseClient();

  // Look up existing user via profiles table (no pagination issues unlike listUsers)
  const { data: existingProfile } = await service
    .from("profiles")
    .select("auth_user_id, role")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existingProfile) {
    // Update password + confirm email so signInWithPassword always works
    const { error: updateError } = await service.auth.admin.updateUserById(existingProfile.auth_user_id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 });
    }

    // Sync role if it changed
    if (existingProfile.role !== role) {
      await service.from("profiles").update({ role }).eq("auth_user_id", existingProfile.auth_user_id);
    }

    return NextResponse.json({ ok: true, action: "updated" });
  }

  // Create new confirmed user
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, role },
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: `Create failed: ${createError?.message}` }, { status: 500 });
  }

  // Create profile
  await service.from("profiles").insert({
    auth_user_id: created.user.id,
    full_name,
    email,
    role,
  });

  return NextResponse.json({ ok: true, action: "created" });
}
