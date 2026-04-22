// Workout suggestion engine
// Analyses workout history to recommend which dungeon to do today
// based on the Push / Pull / Legs (PPL) split rotation.

import { DUNGEONS, PPL_ROTATION } from '../data/exercises';

/**
 * Maps dungeon IDs to their PPL split category.
 */
const DUNGEON_SPLIT_MAP = {
  push:             'push',
  pull:             'pull',
  legs:             'legs',
  recovery:         'rest',
  cardio:           'rest',
  warmup_stretching:'flex',
};

/**
 * Ideal next split given the last split trained.
 * Following the Day 1 Push → Day 2 Rest → Day 3 Pull → Day 4 Rest → Day 5 Legs cycle.
 */
const IDEAL_NEXT = {
  push:  ['rest', 'pull'],   // after push → rest day or go to pull
  pull:  ['rest', 'legs'],   // after pull → rest day or go to legs
  legs:  ['rest', 'push'],   // after legs → rest day or go to push
  rest:  ['push', 'pull', 'legs'],  // after rest → any main lift
  flex:  ['push', 'pull', 'legs'],  // after stretching → any main lift
};

/**
 * Analyses workout history and returns a suggested dungeon with reasoning.
 *
 * @param {Array}  workoutHistory - Array of workout history entries
 * @param {Object} stats          - Current player stats { STR, VIT, AGI, END, INT, PER }
 * @returns {{ dungeon, reason, daysSinceLastWorked, scores, alternatives }}
 */
export function getWorkoutSuggestion(workoutHistory = [], stats = {}) {
  // Arcane Grove (warmup/stretching) is not a standalone workout suggestion
  const CANDIDATE_DUNGEONS = DUNGEONS.filter(d => d.id !== 'warmup_stretching');

  if (!workoutHistory || workoutHistory.length === 0) {
    const firstDungeon = CANDIDATE_DUNGEONS.find(d => d.id === 'push') || CANDIDATE_DUNGEONS[0];
    return {
      dungeon: firstDungeon,
      reason: 'Start your journey! Begin with Push Day — Chest, Shoulders & Triceps.',
      daysSinceLastWorked: null,
      isFirstTime: true,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build reverse lookup: stat → dungeon id
  const statToDungeon = {};
  DUNGEONS.forEach(d => { statToDungeon[d.stat] = d.id; });

  // Analyse history — track last-worked day and count per dungeon
  const dungeonLastWorked = {};
  const dungeonWorkoutCount = {};

  workoutHistory.forEach(entry => {
    const stats_earned = entry.statXPEarned || {};
    const primaryStat = Object.entries(stats_earned).sort((a, b) => b[1] - a[1])[0];
    if (!primaryStat) return;

    const dungeonId = statToDungeon[primaryStat[0]];
    if (!dungeonId) return;

    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    if (dungeonLastWorked[dungeonId] === undefined || daysDiff < dungeonLastWorked[dungeonId]) {
      dungeonLastWorked[dungeonId] = daysDiff;
    }
    dungeonWorkoutCount[dungeonId] = (dungeonWorkoutCount[dungeonId] || 0) + 1;
  });

  // Determine the last split trained (for PPL rotation logic)
  let lastSplit = null;
  if (workoutHistory.length > 0) {
    const lastEntry = workoutHistory[0];
    const lastStat = Object.entries(lastEntry.statXPEarned || {}).sort((a, b) => b[1] - a[1])[0];
    if (lastStat) {
      const lastDungeonId = statToDungeon[lastStat[0]];
      lastSplit = DUNGEON_SPLIT_MAP[lastDungeonId] || null;
    }
  }

  // Score each candidate dungeon
  const scores = {};
  const reasons = {};

  CANDIDATE_DUNGEONS.forEach(dungeon => {
    let score = 0;
    const daysSince = dungeonLastWorked[dungeon.id];
    const workoutCount = dungeonWorkoutCount[dungeon.id] || 0;
    const currentSplit = DUNGEON_SPLIT_MAP[dungeon.id];

    // ── Factor 1: PPL rotation alignment (0–40 points) ──────────────
    // Highest priority: follow the correct PPL cycle
    if (lastSplit && IDEAL_NEXT[lastSplit]) {
      if (IDEAL_NEXT[lastSplit].includes(currentSplit)) {
        score += 40;
        if (currentSplit === 'rest') {
          reasons[dungeon.id] = 'Perfect recovery day after yesterday\'s session.';
        } else {
          reasons[dungeon.id] = `Follows your PPL rotation — ${dungeon.splitLabel} day is next!`;
        }
      } else if (currentSplit === lastSplit) {
        // Same split as yesterday — penalise unless it's rest/flex
        if (currentSplit !== 'rest' && currentSplit !== 'flex') {
          score -= 30;
          reasons[dungeon.id] = 'Same muscle group trained yesterday — needs more rest.';
        }
      }
    }

    // ── Factor 2: Rest days since last session (0–30 points) ─────────
    if (daysSince === undefined) {
      score += 30;
      reasons[dungeon.id] = reasons[dungeon.id] || 'You haven\'t tried this dungeon yet!';
    } else if (daysSince === 0) {
      score -= 40;
      reasons[dungeon.id] = 'Already trained today.';
    } else if (daysSince === 1) {
      score += 5;
      reasons[dungeon.id] = reasons[dungeon.id] || 'Trained yesterday — muscles may still be recovering.';
    } else {
      const restScore = Math.min(daysSince * 8, 30);
      score += restScore;
      reasons[dungeon.id] = reasons[dungeon.id] || `${daysSince} days since last session — you\'re rested!`;
    }

    // ── Factor 3: Stat balance (0–20 points) ─────────────────────────
    const statValue = stats[dungeon.stat] || 0;
    const allStatValues = Object.values(stats).filter(v => typeof v === 'number');
    const avgStat = allStatValues.length > 0
      ? allStatValues.reduce((a, b) => a + b, 0) / allStatValues.length
      : 0;

    if (avgStat > 0) {
      const deficit = avgStat - statValue;
      const balanceScore = Math.min(Math.max(deficit / avgStat * 20, -10), 20);
      score += balanceScore;
      if (deficit > avgStat * 0.2) {
        reasons[dungeon.id] = `Your ${dungeon.stat} stat needs attention! ${reasons[dungeon.id] || ''}`.trim();
      }
    }

    // ── Factor 4: Workout frequency balance (0–10 points) ────────────
    const totalWorkouts = Object.values(dungeonWorkoutCount).reduce((a, b) => a + b, 0);
    const avgCount = totalWorkouts / CANDIDATE_DUNGEONS.length;
    if (avgCount > 0 && workoutCount < avgCount) {
      score += Math.min((avgCount - workoutCount) * 5, 10);
    }

    scores[dungeon.id] = score;
  });

  // Pick the highest-scoring dungeon
  const sortedDungeons = CANDIDATE_DUNGEONS
    .map(d => ({ dungeon: d, score: scores[d.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const best = sortedDungeons[0];
  const daysSince = dungeonLastWorked[best.dungeon.id];

  return {
    dungeon: best.dungeon,
    reason: reasons[best.dungeon.id] || 'This dungeon fits your PPL training schedule.',
    daysSinceLastWorked: daysSince ?? null,
    isFirstTime: false,
    scores,
    alternatives: sortedDungeons.slice(1, 3).map(s => ({
      dungeon: s.dungeon,
      reason: reasons[s.dungeon.id],
    })),
  };
}
