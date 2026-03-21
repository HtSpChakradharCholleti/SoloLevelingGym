// XP, Level, and Rank progression system

export const RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];

export const RANK_THRESHOLDS = {
  E: { minLevel: 1, maxLevel: 10 },
  D: { minLevel: 11, maxLevel: 20 },
  C: { minLevel: 21, maxLevel: 30 },
  B: { minLevel: 31, maxLevel: 40 },
  A: { minLevel: 41, maxLevel: 50 },
  S: { minLevel: 51, maxLevel: Infinity },
};

export const RANK_TITLES = {
  E: 'E-Rank Hunter',
  D: 'D-Rank Hunter',
  C: 'C-Rank Hunter',
  B: 'B-Rank Hunter',
  A: 'A-Rank Hunter',
  S: 'S-Rank Hunter',
};

/**
 * Calculate XP required to reach the next level
 * Formula: level * 100 + level^2 * 10
 */
export const getRequiredXP = (level) => {
  return level * 100 + (level * level) * 10;
};

/**
 * Get rank for a given level
 */
export const getRankForLevel = (level) => {
  for (const [rank, { minLevel, maxLevel }] of Object.entries(RANK_THRESHOLDS)) {
    if (level >= minLevel && level <= maxLevel) {
      return rank;
    }
  }
  return 'S';
};

/**
 * Calculate stat level from total stat XP
 * Stat level increases every 200 XP
 */
export const getStatLevel = (statXP) => {
  return Math.floor(statXP / 200) + 1;
};

/**
 * Get progress to next stat level (0-1)
 */
export const getStatProgress = (statXP) => {
  return (statXP % 200) / 200;
};

/**
 * Process XP gain, handle level-up, and return results
 */
export const processXPGain = (currentLevel, currentXP, xpGained) => {
  let level = currentLevel;
  let xp = currentXP + xpGained;
  let levelsGained = 0;
  let oldRank = getRankForLevel(level);

  while (xp >= getRequiredXP(level)) {
    xp -= getRequiredXP(level);
    level += 1;
    levelsGained += 1;
  }

  const newRank = getRankForLevel(level);
  const rankUp = newRank !== oldRank;

  return {
    newLevel: level,
    newXP: xp,
    levelsGained,
    rankUp,
    oldRank,
    newRank,
  };
};

/**
 * Get level progress as percentage (0-1)
 */
export const getLevelProgress = (level, currentXP) => {
  const required = getRequiredXP(level);
  return Math.min(currentXP / required, 1);
};

/**
 * Calculate total XP accumulated across all levels
 */
export const getTotalXPAccumulated = (level, currentXP) => {
  let total = currentXP;
  for (let i = 1; i < level; i++) {
    total += getRequiredXP(i);
  }
  return total;
};
