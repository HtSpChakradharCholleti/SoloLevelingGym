import {
  RANKS,
  RANK_THRESHOLDS,
  getRequiredXP,
  getRankForLevel,
  processXPGain,
  getLevelProgress,
  getTotalXPAccumulated,
} from '../../../src/utils/leveling';

describe('getRequiredXP', () => {
  it('returns level * 100 + level^2 * 10', () => {
    expect(getRequiredXP(1)).toBe(110);
    expect(getRequiredXP(2)).toBe(240);
    expect(getRequiredXP(10)).toBe(2000);
    expect(getRequiredXP(50)).toBe(30000);
  });
});

describe('getRankForLevel', () => {
  it.each([
    [1, 'E'],
    [10, 'E'],
    [11, 'D'],
    [20, 'D'],
    [21, 'C'],
    [30, 'C'],
    [31, 'B'],
    [40, 'B'],
    [41, 'A'],
    [50, 'A'],
    [51, 'S'],
    [99, 'S'],
  ])('level %i maps to rank %s', (level, expectedRank) => {
    expect(getRankForLevel(level)).toBe(expectedRank);
  });

  it('returns S for levels beyond the defined thresholds', () => {
    expect(getRankForLevel(1000)).toBe('S');
  });

  it('covers every rank in RANKS', () => {
    RANKS.forEach((rank) => {
      const threshold = RANK_THRESHOLDS[rank];
      expect(getRankForLevel(threshold.minLevel)).toBe(rank);
    });
  });
});

describe('processXPGain', () => {
  it('adds XP without leveling when below the threshold', () => {
    const result = processXPGain(1, 0, 50);
    expect(result).toMatchObject({
      newLevel: 1,
      newXP: 50,
      levelsGained: 0,
      rankUp: false,
      oldRank: 'E',
      newRank: 'E',
    });
  });

  it('levels up once and carries leftover XP', () => {
    // Level 1 requires 110 XP; gain 150 -> level 2 with 40 XP
    const result = processXPGain(1, 0, 150);
    expect(result).toMatchObject({
      newLevel: 2,
      newXP: 40,
      levelsGained: 1,
      rankUp: false,
      oldRank: 'E',
      newRank: 'E',
    });
  });

  it('handles multi-level gains', () => {
    // Level 1 needs 110, level 2 needs 240, level 3 needs 390.
    // Total to reach level 4 from zero = 110 + 240 + 390 = 740.
    const result = processXPGain(1, 0, 800);
    expect(result).toMatchObject({
      newLevel: 4,
      newXP: 60,
      levelsGained: 3,
      oldRank: 'E',
      newRank: 'E',
    });
  });

  it('reports a rank up when crossing a rank threshold', () => {
    // Reaching level 11 crosses E -> D.
    const result = processXPGain(10, 0, getRequiredXP(10) + 1);
    expect(result.newLevel).toBe(11);
    expect(result.rankUp).toBe(true);
    expect(result.oldRank).toBe('E');
    expect(result.newRank).toBe('D');
  });

  it('caps gracefully at very high XP values', () => {
    const result = processXPGain(1, 0, 1_000_000);
    expect(result.levelsGained).toBeGreaterThan(10);
    expect(result.newRank).toBe('S');
  });
});

describe('getLevelProgress', () => {
  it('returns the ratio of current XP to required XP', () => {
    expect(getLevelProgress(1, 55)).toBeCloseTo(0.5, 2);
  });

  it('clamps at 1.0 when XP exceeds requirement', () => {
    expect(getLevelProgress(1, getRequiredXP(1) + 50)).toBe(1);
  });

  it('returns 0 when no XP is accumulated', () => {
    expect(getLevelProgress(5, 0)).toBe(0);
  });
});

describe('getTotalXPAccumulated', () => {
  it('sums required XP for all prior levels plus current XP', () => {
    // Level 3: 110 (L1) + 240 (L2) + 50 current
    expect(getTotalXPAccumulated(3, 50)).toBe(400);
  });

  it('returns only current XP for level 1', () => {
    expect(getTotalXPAccumulated(1, 75)).toBe(75);
  });

  it('returns the full XP required to reach the exact next level', () => {
    // To be at level 3 with 0 XP means we already spent 110 + 240.
    expect(getTotalXPAccumulated(3, 0)).toBe(350);
  });
});
