import type { PillarScores, Pillar, Question } from '@/types/database';

export function computePillarScores(
  responses: Record<string, number>,
  questions: Question[]
): PillarScores {
  const buckets: Record<Pillar, number[]> = {
    emotional: [],
    resilience: [],
    recovery: [],
    support: [],
  };

  for (const question of questions) {
    const value = responses[question.id];
    if (value !== undefined) {
      buckets[question.pillar].push(value);
    }
  }

  const avg = (nums: number[]) =>
    nums.length === 0 ? 5 : nums.reduce((a, b) => a + b, 0) / nums.length;

  return {
    emotional:  parseFloat(avg(buckets.emotional).toFixed(2)),
    resilience: parseFloat(avg(buckets.resilience).toFixed(2)),
    recovery:   parseFloat(avg(buckets.recovery).toFixed(2)),
    support:    parseFloat(avg(buckets.support).toFixed(2)),
  };
}

export function evaluateSupportTrigger(scores: PillarScores): boolean {
  // High emotional distress OR very poor recovery
  return scores.emotional > 8 || scores.recovery < 3;
}

export type PillarLevel = 'stable' | 'moderate' | 'elevated' | 'high';

export function scoreToPillarLevel(score: number): PillarLevel {
  if (score >= 7) return 'stable';
  if (score >= 5) return 'moderate';
  if (score >= 3) return 'elevated';
  return 'high';
}

export const PILLAR_COLORS: Record<Pillar, string> = {
  emotional:  'emerald',
  resilience: 'blue',
  recovery:   'violet',
  support:    'amber',
};

export const PILLAR_LABELS: Record<Pillar, string> = {
  emotional:  'Emotional',
  resilience: 'Resilience',
  recovery:   'Recovery',
  support:    'Support',
};
