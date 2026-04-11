import type { Question, QuestionUsage, CheckinMode, Pillar } from '@/types/database';

const COOLDOWN_DAYS = 14;
const PILLARS: Pillar[] = ['emotional', 'resilience', 'recovery', 'support'];

const WEEKLY_PER_PILLAR = 2;   // 2 questions × 4 pillars = 8 total
const SCREENING_PER_PILLAR = 4; // 4 questions × 4 pillars = 16 total

function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getDaySeed(athleteId: string): number {
  // Deterministic per athlete+week so reload returns the same questions
  const week = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  let hash = week;
  for (let i = 0; i < athleteId.length; i++) {
    hash = (hash * 31 + athleteId.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
}

export function selectQuestionsForSession(
  athleteId: string,
  mode: CheckinMode,
  allQuestions: Question[],
  recentUsage: QuestionUsage[]
): Question[] {
  const cutoff = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const recentIds = new Set(
    recentUsage
      .filter(u => new Date(u.used_at) > cutoff)
      .map(u => u.question_id)
  );

  const perPillar = mode === 'weekly' ? WEEKLY_PER_PILLAR : SCREENING_PER_PILLAR;
  const seed = getDaySeed(athleteId);
  const selected: Question[] = [];

  for (const pillar of PILLARS) {
    const pool = allQuestions.filter(
      q => q.pillar === pillar && q.active && q.modes.includes(mode) && !recentIds.has(q.id)
    );
    // Fall back to used questions if pool is exhausted
    const fallback = allQuestions.filter(
      q => q.pillar === pillar && q.active && q.modes.includes(mode) && recentIds.has(q.id)
    );
    const available = pool.length >= perPillar ? pool : [...pool, ...fallback];
    const shuffled = seededShuffle(available, seed + pillar.length);
    selected.push(...shuffled.slice(0, perPillar));
  }

  // Final shuffle across all pillars
  return seededShuffle(selected, seed);
}
