"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { calculateRiskLevel, getRiskTriggerType } from "@/utils/risk-scoring";
import { createClient } from "@/lib/supabase/client";
import {
  CheckCircle,
  ChevronRight,
  ChevronLeft,
  Brain,
  Heart,
  Users,
  Church,
  GraduationCap,
  Trophy,
  Home,
} from "lucide-react";

/* ─── Score Slider ────────────────────────────────────────────── */

function ScoreSlider({
  label,
  description,
  prompt,
  value,
  onChange,
  lowLabel,
  highLabel,
  icon,
}: {
  label: string;
  description: string;
  prompt: string;
  value: number;
  onChange: (v: number) => void;
  lowLabel: string;
  highLabel: string;
  icon?: React.ReactNode;
}) {
  // Color based on value
  const valueColor =
    value <= 3
      ? "text-red-500"
      : value <= 5
        ? "text-amber-500"
        : value <= 7
          ? "text-emerald-500"
          : "text-emerald-600";

  const valueLabel =
    value <= 2
      ? "Struggling"
      : value <= 4
        ? "Not great"
        : value <= 6
          ? "Okay"
          : value <= 8
            ? "Good"
            : "Thriving";

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 bg-slate-100 rounded-xl shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Label className="text-base font-semibold text-slate-900">{label}</Label>
          <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          <p className="text-xs text-slate-400 mt-1 italic">{prompt}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1.5">
            <span>{lowLabel}</span>
            <span>{highLabel}</span>
          </div>
        </div>
        <div className="text-center w-16 shrink-0">
          <span className={`text-3xl font-bold tabular-nums ${valueColor}`}>
            {value}
          </span>
          <p className="text-[10px] text-slate-400 mt-0.5">{valueLabel}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Step indicator ──────────────────────────────────────────── */

function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-1.5 flex-1">
          <div
            className={`h-1.5 rounded-full flex-1 transition-colors duration-300 ${
              i < current
                ? "bg-emerald-500"
                : i === current
                  ? "bg-emerald-400"
                  : "bg-slate-200"
            }`}
          />
        </div>
      ))}
      <span className="text-xs text-slate-400 ml-2 shrink-0">
        {labels[current]}
      </span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */

export default function CheckinPage() {
  const router = useRouter();
  const supabase = createClient();

  // Step navigation
  const [step, setStep] = useState(0);

  // Core questions (always shown)
  const [mood, setMood] = useState(5);
  const [stress, setStress] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [support, setSupport] = useState(5);

  // Deep life dimensions
  const [family, setFamily] = useState(5);
  const [social, setSocial] = useState(5);
  const [spiritual, setSpiritual] = useState(5);
  const [academic, setAcademic] = useState(5);
  const [athleticConfidence, setAthleticConfidence] = useState(5);

  // Preferences-driven visibility
  const [showSpiritual, setShowSpiritual] = useState(false);
  const [showFamily, setShowFamily] = useState(true);

  // Followup & notes
  const [wantsFollowup, setWantsFollowup] = useState(false);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    id: string;
    team_id: string | null;
    full_name: string;
  } | null>(null);

  // Load preferences to decide which questions to show
  useEffect(() => {
    async function loadPrefs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: prof } = await supabase
        .from("profiles")
        .select("id, team_id, full_name")
        .eq("auth_user_id", user.id)
        .single();

      if (prof) {
        setProfileData(prof);

        const { data: prefs } = await supabase
          .from("athlete_preferences")
          .select("wants_faith_support, wants_family_checkins")
          .eq("athlete_id", prof.id)
          .single();

        if (prefs) {
          setShowSpiritual(prefs.wants_faith_support);
          setShowFamily(prefs.wants_family_checkins);
        }
      }
      setProfileLoading(false);
    }
    loadPrefs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const riskLevel = calculateRiskLevel({
      mood,
      stress,
      sleep,
      support,
      family: showFamily ? family : null,
      social,
      spiritual: showSpiritual ? spiritual : null,
      academic,
      athleticConfidence,
      wantsFollowup,
    });
    const triggerType = getRiskTriggerType({
      mood,
      stress,
      sleep,
      support,
      wantsFollowup,
    });

    if (!profileData) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    // Insert check-in
    const { data: checkin, error: checkinError } = await supabase
      .from("checkins")
      .insert({
        athlete_id: profileData.id,
        team_id: profileData.team_id,
        mood_score: mood,
        stress_score: stress,
        sleep_score: sleep,
        support_score: support,
        family_score: showFamily ? family : null,
        social_score: social,
        spiritual_score: showSpiritual ? spiritual : null,
        academic_score: academic,
        athletic_confidence_score: athleticConfidence,
        wants_followup: wantsFollowup,
        notes_private: notes || null,
        risk_level: riskLevel,
      })
      .select()
      .single();

    if (checkinError) {
      setError("Failed to submit check-in. Please try again.");
      setLoading(false);
      return;
    }

    // Create alert if yellow or red
    if (riskLevel !== "green" && checkin) {
      const { data: alertData } = await supabase
        .from("alerts")
        .insert({
          athlete_id: profileData.id,
          checkin_id: checkin.id,
          severity: riskLevel === "red" ? "red" : "yellow",
          trigger_type: triggerType,
        })
        .select()
        .single();

      // Send RED alert notification emails
      if (riskLevel === "red" && alertData) {
        try {
          await fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              alertId: alertData.id,
              teamId: profileData.team_id,
            }),
          });
        } catch {
          console.error("Failed to send alert notification");
        }
      }
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      actor_profile_id: profileData.id,
      action: "create",
      target_type: "checkin",
      target_id: checkin?.id,
      metadata: { risk_level: riskLevel },
    });

    setSubmitted(true);
    setLoading(false);
  };

  /* ── Step definitions ────────────────────────────────── */

  const stepLabels = ["Mind & Body", "Your Life", "Reflect"];

  const steps = [
    // STEP 0: Mind & Body (core)
    <div key="core" className="space-y-8">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900">Mind & Body</h2>
        <p className="text-sm text-slate-500">
          Let&apos;s start with how you&apos;re feeling right now.
        </p>
      </div>

      <ScoreSlider
        label="Overall Mood"
        description="How are you really doing today?"
        prompt="Not the answer you give when someone asks in passing — the honest one."
        value={mood}
        onChange={setMood}
        lowLabel="Really struggling"
        highLabel="Genuinely great"
        icon={<Brain className="h-5 w-5 text-slate-500" />}
      />

      <ScoreSlider
        label="Stress Level"
        description="How heavy does everything feel right now?"
        prompt="School, sport, life — all of it combined."
        value={stress}
        onChange={setStress}
        lowLabel="Calm & manageable"
        highLabel="Completely overwhelmed"
        icon={<Heart className="h-5 w-5 text-slate-500" />}
      />

      <ScoreSlider
        label="Sleep Quality"
        description="How have you been sleeping this week?"
        prompt="Think about falling asleep, staying asleep, and waking up rested."
        value={sleep}
        onChange={setSleep}
        lowLabel="Barely sleeping"
        highLabel="Sleeping great"
        icon={<Brain className="h-5 w-5 text-slate-500" />}
      />

      <ScoreSlider
        label="Feeling Supported"
        description="Do you feel like someone has your back?"
        prompt="Think about teammates, coaches, friends, family, anyone in your corner."
        value={support}
        onChange={setSupport}
        lowLabel="Totally alone"
        highLabel="Very supported"
        icon={<Users className="h-5 w-5 text-slate-500" />}
      />
    </div>,

    // STEP 1: Life dimensions (deeper questions)
    <div key="life" className="space-y-8">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900">Your Life</h2>
        <p className="text-sm text-slate-500">
          You&apos;re more than an athlete. How are these parts of your life going?
        </p>
      </div>

      {showFamily && (
        <ScoreSlider
          label="Family & Home"
          description="How are things going with your family?"
          prompt="Relationships at home, missing family, financial pressures, any family stress."
          value={family}
          onChange={setFamily}
          lowLabel="Really tough"
          highLabel="Solid & stable"
          icon={<Home className="h-5 w-5 text-slate-500" />}
        />
      )}

      <ScoreSlider
        label="Social & Relationships"
        description="How connected do you feel to people you care about?"
        prompt="Friendships, romantic relationships, feeling like you belong."
        value={social}
        onChange={setSocial}
        lowLabel="Isolated & lonely"
        highLabel="Deeply connected"
        icon={<Users className="h-5 w-5 text-slate-500" />}
      />

      <ScoreSlider
        label="Academic Life"
        description="How are you managing school right now?"
        prompt="Classes, assignments, time management, feeling on top of your work."
        value={academic}
        onChange={setAcademic}
        lowLabel="Falling behind"
        highLabel="On top of it"
        icon={<GraduationCap className="h-5 w-5 text-slate-500" />}
      />

      <ScoreSlider
        label="Athletic Confidence"
        description="How are you feeling about your sport?"
        prompt="Your performance, your role on the team, joy for the game."
        value={athleticConfidence}
        onChange={setAthleticConfidence}
        lowLabel="Lost & doubting"
        highLabel="Confident & motivated"
        icon={<Trophy className="h-5 w-5 text-slate-500" />}
      />

      {showSpiritual && (
        <ScoreSlider
          label="Spiritual & Inner Life"
          description="How is your spiritual or inner life?"
          prompt="Faith, purpose, peace of mind — whatever that means to you."
          value={spiritual}
          onChange={setSpiritual}
          lowLabel="Disconnected"
          highLabel="Grounded & at peace"
          icon={<Church className="h-5 w-5 text-slate-500" />}
        />
      )}
    </div>,

    // STEP 2: Reflect & submit
    <div key="reflect" className="space-y-6">
      <div className="mb-2">
        <h2 className="text-lg font-bold text-slate-900">Reflect</h2>
        <p className="text-sm text-slate-500">
          Anything else on your heart? This is your space.
        </p>
      </div>

      {/* Summary snapshot */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "Mood", value: mood },
          { label: "Stress", value: stress, invert: true },
          { label: "Sleep", value: sleep },
          { label: "Supported", value: support },
          ...(showFamily ? [{ label: "Family", value: family }] : []),
          { label: "Social", value: social },
          { label: "Academic", value: academic },
          { label: "Athletic", value: athleticConfidence },
          ...(showSpiritual ? [{ label: "Spiritual", value: spiritual }] : []),
        ].map((item) => {
          const displayVal = item.value;
          const color =
            (item as { invert?: boolean }).invert
              ? displayVal >= 8
                ? "bg-red-50 text-red-600 border-red-200"
                : displayVal >= 6
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
              : displayVal <= 3
                ? "bg-red-50 text-red-600 border-red-200"
                : displayVal <= 5
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-emerald-50 text-emerald-600 border-emerald-200";
          return (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${color}`}
            >
              <span className="text-xs font-medium">{item.label}</span>
              <span className="text-lg font-bold tabular-nums">{displayVal}</span>
            </div>
          );
        })}
      </div>

      {/* Private notes */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">
          Anything on your mind?{" "}
          <span className="text-slate-400 font-normal">(optional, private)</span>
        </Label>
        <Textarea
          placeholder="This is just for you. Write whatever you need to get off your chest..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="resize-none"
        />
        <p className="text-[11px] text-slate-400">
          Your notes are private and never shared with coaches or staff.
        </p>
      </div>

      {/* Follow-up request */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200/60">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={wantsFollowup}
            onChange={(e) => setWantsFollowup(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <div>
            <span className="text-sm font-semibold text-slate-900">
              I&apos;d like someone to check in with me
            </span>
            <p className="text-xs text-slate-500 mt-1">
              A licensed counselor or support person will reach out privately.
              Not your coach — someone trained to help.
            </p>
          </div>
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>,
  ];

  /* ── Submitted state ─────────────────────────────────── */

  if (submitted) {
    return (
      <DashboardLayout role="athlete" userName={profileData?.full_name || "Athlete"}>
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Check-in submitted
              </h2>
              <p className="text-slate-500 mb-2">
                Thanks for being honest. That takes courage.
              </p>
              <p className="text-sm text-slate-400 mb-6">
                Your well-being matters more than your performance.
              </p>
              {wantsFollowup && (
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm text-emerald-700 font-medium">
                    Someone from your support team will reach out to you soon.
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    This goes to a licensed counselor, not your coaching staff.
                  </p>
                </div>
              )}
              <Button onClick={() => router.push("/athlete/dashboard")}>
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (profileLoading) {
    return (
      <DashboardLayout role="athlete" userName="...">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  /* ── Main form ───────────────────────────────────────── */

  return (
    <DashboardLayout role="athlete" userName={profileData?.full_name || "Athlete"}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Weekly Check-In</h1>
          <p className="text-slate-500 mt-1">
            Be real. Be honest. This is for <em>you</em>.
          </p>
        </div>

        {/* Crisis & disclosure banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-xs text-amber-800 leading-relaxed">
            <strong>Important:</strong> If you are in crisis, contact the{" "}
            <strong>988 Suicide &amp; Crisis Lifeline</strong> (call/text 988) or 911
            immediately. This check-in is a wellness tool, not a crisis service.
            Responses that indicate elevated risk may be shared with qualified support
            staff per the <a href="/privacy" className="underline">privacy model</a>.
            Coaches see only aggregate team data, never your individual responses.
          </p>
        </div>

        {/* Step progress */}
        <StepIndicator current={step} total={steps.length} labels={stepLabels} />

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {step === 0
                ? "How are you feeling?"
                : step === 1
                  ? "The whole you"
                  : "One last thing"}
            </CardTitle>
            <CardDescription>
              {step === 0
                ? "Rate each area 1–10. Only licensed support staff see flagged responses — never coaches."
                : step === 1
                  ? "Your life off the field matters just as much. Be honest."
                  : "Review your responses and share anything else."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {steps[step]}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-100">
              {step > 0 ? (
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              ) : (
                <div />
              )}

              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} className="gap-1">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  size="lg"
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? "Submitting..." : "Submit Check-In"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Encouragement footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          This takes about 3 minutes. Every answer helps your program support you better.
        </p>
      </div>
    </DashboardLayout>
  );
}
