import { RiskLevel } from "@/types/database";

interface RiskInput {
  mood: number;
  stress: number;
  sleep: number;
  support: number;
  family?: number | null;
  social?: number | null;
  spiritual?: number | null;
  academic?: number | null;
  athleticConfidence?: number | null;
  wantsFollowup: boolean;
}

/**
 * Calculate risk level using priority-ordered decision tree.
 * Steps evaluated in order — first match terminates.
 *
 * 1. wantsFollowup === true → RED (short-circuit)
 * 2. Count core risk factors: mood ≤ 3, stress ≥ 8, sleep ≤ 3, support ≤ 3
 * 3. Count life-dimension risk factors (if answered): family ≤ 3, social ≤ 3,
 *    spiritual ≤ 3, academic ≤ 3, athletic confidence ≤ 3
 *    Each life-dimension factor counts as 0.5 core factors
 * 4. Composite score ≥ 3 → RED
 * 5. Composite score ≥ 1.5 → YELLOW
 * 6. Otherwise → GREEN
 */
export function calculateRiskLevel(input: RiskInput): RiskLevel {
  const { mood, stress, sleep, support, wantsFollowup } = input;

  // Step 1: Short-circuit if athlete explicitly requests follow-up
  if (wantsFollowup) return "red";

  // Step 2: Evaluate four core risk factors (weight = 1 each)
  const coreFactors = [
    mood <= 3,
    stress >= 8,
    sleep <= 3,
    support <= 3,
  ];
  const coreCount = coreFactors.filter(Boolean).length;

  // Step 3: Evaluate life-dimension factors (weight = 0.5 each)
  const lifeDimensions = [
    input.family,
    input.social,
    input.spiritual,
    input.academic,
    input.athleticConfidence,
  ];
  const lifeFactorCount = lifeDimensions
    .filter((v): v is number => v != null)
    .filter((v) => v <= 3).length;

  const compositeScore = coreCount + lifeFactorCount * 0.5;

  // Step 4-6: Determine level
  if (compositeScore >= 3) return "red";
  if (compositeScore >= 1.5) return "yellow";
  return "green";
}

/**
 * Determine the trigger type string for alert records.
 */
export function getRiskTriggerType(input: RiskInput): string {
  if (input.wantsFollowup) return "wants_followup";
  return "risk_score";
}
