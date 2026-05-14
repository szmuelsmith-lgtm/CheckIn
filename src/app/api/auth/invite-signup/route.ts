/**
 * POST /api/auth/invite-signup
 *
 * Signs up a new user using a valid invite code, bypassing email confirmation
 * so the tester can log in immediately. Uses the service-role admin client.
 *
 * Body: { email, password, fullName, inviteCode }
 * Returns: { ok: true } on success — client then calls signInWithPassword.
 */
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body: { email: string; password: string; fullName: string; inviteCode: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { email, password, fullName, inviteCode } = body;

  if (!email || !password || !fullName || !inviteCode) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const service = createServiceSupabaseClient();

  // 1. Validate invite code
  const { data: invite, error: inviteError } = await service
    .from("invite_codes")
    .select("*")
    .eq("code", inviteCode.trim().toUpperCase())
    .single();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 400 });
  }

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite code has expired." }, { status: 400 });
  }

  if (invite.uses_remaining !== null && invite.uses_remaining <= 0) {
    return NextResponse.json({ error: "This invite code has been fully used." }, { status: 400 });
  }

  // 2. Check if the email is already registered
  const { data: { users: existingUsers } } = await service.auth.admin.listUsers();
  const existing = existingUsers.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  // 3. Create user with email pre-confirmed so no verification email is needed
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role: invite.role },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "Failed to create account." },
      { status: 500 }
    );
  }

  // 4. Create profile
  const { error: profileError } = await service.from("profiles").insert({
    auth_user_id:    created.user.id,
    full_name:       fullName,
    email,
    role:            invite.role,
    organization_id: invite.organization_id ?? null,
    team_id:         invite.team_id ?? null,
  });

  if (profileError) {
    // Roll back auth user to avoid orphaned accounts
    await service.auth.admin.deleteUser(created.user.id);
    return NextResponse.json({ error: "Profile creation failed. Please try again." }, { status: 500 });
  }

  // 5. Decrement uses_remaining if applicable
  if (invite.uses_remaining !== null) {
    await service
      .from("invite_codes")
      .update({ uses_remaining: invite.uses_remaining - 1 })
      .eq("id", invite.id);
  }

  return NextResponse.json({ ok: true, role: invite.role });
}
