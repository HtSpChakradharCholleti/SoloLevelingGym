// Workout suggestion engine
// Analyzes workout history to recommend which dungeon to do today

import { DUNGEONS } from '../data/exercises';

/**
 * Mapping from dungeon IDs to the muscle group "split" category.
 * This helps identify overlapping muscle groups even across dungeons.
 */
const DUNGEON_SPLIT_MAP = {
  chest_tricep: 'push',      // Push
  legs_shoulders: 'legs',    // Legs (shoulders are secondary)
  back_bicep: 'pull',        // Pull
  cardio: 'cardio',          // Cardio
  core: 'core',              // Core
  warmup_stretching: 'flex', // Flexibility
};

/**
 * Analyzes workout history and returns a suggested dungeon with reasoning.
 * 
 * @param {Array} workoutHistory - Array of workout history entries
 * @param {Object} stats - Current player stats { STR, VIT, AGI, END, INT, PER }
 * @returns {{ dungeon: Object, reason: string, daysSinceLastWorked: number|null, scores: Object }}
 */
export function getWorkoutSuggestion(workoutHistory = [], stats = {}) {
  // Exclude warmup/stretching — it's done before/after every workout, not a standalone session
  const CANDIDATE_DUNGEONS = DUNGEONS.filter(d => d.id !== 'warmup_stretching');

  if (!workoutHistory || workoutHistory.length === 0) {
    // No history — suggest the first candidate dungeon
    return {
      dungeon: CANDIDATE_DUNGEONS[0],
      reason: 'Start your journey! Begin with any dungeon.',
      daysSinceLastWorked: null,
      isFirstTime: true,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate days since each dungeon was last worked
  const dungeonLastWorked = {};
  const dungeonWorkoutCount = {};
  
  // Map exercise names to dungeon IDs for reverse lookup
  const exerciseToDungeon = {};
  
  // We'll figure out which dungeon each workout belongs to by looking at statXPEarned
  const statToDungeon = {};
  DUNGEONS.forEach(d => {
    statToDungeon[d.stat] = d.id;
  });

  // Analyze history
  workoutHistory.forEach(entry => {
    // Determine which dungeon this workout was for using stat XP earned
    const stats_earned = entry.statXPEarned || {};
    const primaryStat = Object.entries(stats_earned)
      .sort((a, b) => b[1] - a[1])[0];
    
    if (!primaryStat) return;

    const dungeonId = statToDungeon[primaryStat[0]];
    if (!dungeonId) return;

    const entryDate = new Date(entry.date);
    entryDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - entryDate) / (1000 * 60 * 60 * 24));

    // Track the most recent workout for each dungeon
    if (dungeonLastWorked[dungeonId] === undefined || daysDiff < dungeonLastWorked[dungeonId]) {
      dungeonLastWorked[dungeonId] = daysDiff;
    }

    // Track total workout count per dungeon
    dungeonWorkoutCount[dungeonId] = (dungeonWorkoutCount[dungeonId] || 0) + 1;
  });

  // Score each dungeon
  const scores = {};
  const reasons = {};

  CANDIDATE_DUNGEONS.forEach(dungeon => {
    let score = 0;
    const daysSince = dungeonLastWorked[dungeon.id];
    const workoutCount = dungeonWorkoutCount[dungeon.id] || 0;

    // === Factor 1: Rest days (0-50 points) ===
    // More days since last workout = higher score
    if (daysSince === undefined) {
      // Never done this dungeon — high priority!
      score += 45;
      reasons[dungeon.id] = 'You haven\'t explored this dungeon yet!';
    } else if (daysSince === 0) {
      // Already trained today — strongly discourage
      score -= 50;
      reasons[dungeon.id] = 'Already trained today.';
    } else if (daysSince === 1) {
      // Yesterday — mild discourage for recovery
      score += 5;
      reasons[dungeon.id] = `Trained yesterday. Muscles may still be recovering.`;
    } else {
      // 2+ days — good to go, scale with days
      const restScore = Math.min(daysSince * 10, 50);
      score += restScore;
      reasons[dungeon.id] = `${daysSince} days since last session. Muscles are rested!`;
    }

    // === Factor 2: Stat balance (0-30 points) ===
    // Prioritize dungeons that boost the player's weakest stats
    const statValue = stats[dungeon.stat] || 0;
    const allStatValues = Object.values(stats).filter(v => typeof v === 'number');
    const avgStat = allStatValues.length > 0 
      ? allStatValues.reduce((a, b) => a + b, 0) / allStatValues.length 
      : 0;
    
    if (avgStat > 0) {
      const deficit = avgStat - statValue;
      // Positive deficit means this stat is below average
      const balanceScore = Math.min(Math.max(deficit / avgStat * 30, -10), 30);
      score += balanceScore;
      
      if (deficit > avgStat * 0.2) {
        reasons[dungeon.id] = `Your ${dungeon.stat} stat needs attention! ${reasons[dungeon.id] || ''}`;
      }
    }

    // === Factor 3: Workout frequency balance (0-15 points) ===
    // Less-trained dungeons get a small boost
    const totalWorkouts = Object.values(dungeonWorkoutCount).reduce((a, b) => a + b, 0);
    const avgCount = totalWorkouts / CANDIDATE_DUNGEONS.length;
    if (avgCount > 0 && workoutCount < avgCount) {
      score += Math.min((avgCount - workoutCount) * 5, 15);
    }

    // === Factor 4: Smart split rotation (0-20 points) ===
    // If last workout was 'push', suggest 'pull' or 'legs'
    if (workoutHistory.length > 0) {
      const lastWorkout = workoutHistory[0]; // Most recent
      const lastStat = Object.entries(lastWorkout.statXPEarned || {})
        .sort((a, b) => b[1] - a[1])[0];
      
      if (lastStat) {
        const lastDungeonId = statToDungeon[lastStat[0]];
        const lastSplit = DUNGEON_SPLIT_MAP[lastDungeonId];
        const currentSplit = DUNGEON_SPLIT_MAP[dungeon.id];

        // Encourage opposing muscle groups
        if (lastSplit === 'push' && currentSplit === 'pull') score += 20;
        else if (lastSplit === 'pull' && (currentSplit === 'push' || currentSplit === 'legs')) score += 15;
        else if (lastSplit === 'legs' && currentSplit === 'push') score += 15;
        else if (lastSplit === currentSplit && daysSince !== undefined && daysSince <= 1) score -= 10;
      }
    }

    scores[dungeon.id] = score;
  });

  // Find best dungeon
  const sortedDungeons = CANDIDATE_DUNGEONS
    .map(d => ({ dungeon: d, score: scores[d.id] || 0 }))
    .sort((a, b) => b.score - a.score);

  const best = sortedDungeons[0];
  const daysSince = dungeonLastWorked[best.dungeon.id];

  return {
    dungeon: best.dungeon,
    reason: reasons[best.dungeon.id] || 'This dungeon fits your training schedule.',
    daysSinceLastWorked: daysSince ?? null,
    isFirstTime: false,
    scores,
    // Also provide runner-ups for variety
    alternatives: sortedDungeons.slice(1, 3).map(s => ({
      dungeon: s.dungeon,
      reason: reasons[s.dungeon.id],
    })),
  };
}
