"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { UserRole } from "@/types/database";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    // Validate invite code if provided
    let orgId: string | null = null;
    let teamId: string | null = null;
    let role: UserRole = "athlete";

    if (inviteCode.trim()) {
      const { data: invite, error: inviteError } = await supabase
        .from("invite_codes")
        .select("*")
        .eq("code", inviteCode.trim())
        .single();

      if (inviteError || !invite) {
        setError("Invalid invite code.");
        setLoading(false);
        return;
      }

      if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
        setError("This invite code has expired.");
        setLoading(false);
        return;
      }

      if (invite.uses_remaining !== null && invite.uses_remaining <= 0) {
        setError("This invite code has been fully used.");
        setLoading(false);
        return;
      }

      orgId = invite.organization_id;
      teamId = invite.team_id;
      role = invite.role;

      // Decrement uses if limited
      if (invite.uses_remaining !== null) {
        await supabase
          .from("invite_codes")
          .update({ uses_remaining: invite.uses_remaining - 1 })
          .eq("id", invite.id);
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        auth_user_id: authData.user.id,
        full_name: fullName,
        email,
        role,
        organization_id: orgId,
        team_id: teamId,
      });

      if (profileError) {
        setError("Account created but profile setup failed. Please contact support.");
        setLoading(false);
        return;
      }

      // If no invite code, this is an admin creating a new org — handled after email confirmation
      if (!inviteCode.trim()) {
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        athlete: "/athlete/dashboard",
        coach: "/coach/dashboard",
        admin: "/admin/dashboard",
        support: "/admin/dashboard",
      };
      router.push(redirectMap[role] || "/athlete/dashboard");
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <div className="p-3 bg-green-50 rounded-xl inline-block mb-4">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Check your email</h2>
            <p className="text-slate-500">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <Shield className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">
            Create your account
          </CardTitle>
          <CardDescription>
            Join Check-In by Athlete Anchor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Samuel Smith"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inviteCode">
                Invite Code <span className="text-slate-400">(optional)</span>
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter team invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
              <p className="text-xs text-slate-400">
                Got a code from your coach or program? Enter it to join your team.
              </p>
            </div>
            {/* Consent & Disclosure */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  required
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  I acknowledge that I am at least 18 years old. I have read and agree to the{" "}
                  <Link href="/terms" className="text-emerald-600 underline" target="_blank">Terms of Service</Link> and{" "}
                  <Link href="/privacy" className="text-emerald-600 underline" target="_blank">Privacy Policy</Link>.
                  I understand that:
                </span>
              </label>
              <ul className="text-xs text-slate-500 space-y-1 ml-7 list-disc pl-1">
                <li>Check-in responses may be shared with authorized support staff per the three-tier privacy model</li>
                <li>Staff members may be mandatory reporters under Title IX and state law — disclosures of sexual violence, abuse, or harm to minors may be reported to authorities</li>
                <li>This platform is not a medical service, crisis intervention tool, or substitute for professional mental health care</li>
                <li>My institution is the data controller under FERPA; I have the right to inspect, correct, and request deletion of my records</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-red-600" role="alert">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading || !consentChecked}>
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
