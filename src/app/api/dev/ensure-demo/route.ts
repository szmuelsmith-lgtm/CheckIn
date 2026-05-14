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

  // Look up existing user
  const { data: { users }, error: listError } = await service.auth.admin.listUsers();
  if (listError) {
    return NextResponse.json({ error: "Failed to list users" }, { status: 500 });
  }

  const existing = users.find((u) => u.email === email);

  if (existing) {
    // Update password + confirm email in case it wasn't confirmed
    const { error: updateError } = await service.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
    });
    if (updateError) {
      return NextResponse.json({ error: `Update failed: ${updateError.message}` }, { status: 500 });
    }

    // Ensure profile exists with correct role
    const { data: profile } = await service
      .from("profiles")
      .select("id, role")
      .eq("auth_user_id", existing.id)
      .single();

    if (!profile) {
      await service.from("profiles").insert({
        auth_user_id: existing.id,
        full_name,
        email,
        role,
      });
    } else if (profile.role !== role) {
      await service.from("profiles").update({ role }).eq("auth_user_id", existing.id);
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
