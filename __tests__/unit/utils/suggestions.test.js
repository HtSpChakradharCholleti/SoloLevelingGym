import { DUNGEONS } from '../../../src/data/exercises';
import {
  getDungeonFromLastWeek,
  getWorkoutSuggestion,
} from '../../../src/utils/suggestions';

const pushDungeon = DUNGEONS.find((d) => d.id === 'push');
const pullDungeon = DUNGEONS.find((d) => d.id === 'pull');
const legsDungeon = DUNGEONS.find((d) => d.id === 'legs');
const recoveryDungeon = DUNGEONS.find((d) => d.id === 'recovery');

describe('getDungeonFromLastWeek', () => {
  it('returns null dungeon for empty history', () => {
    const result = getDungeonFromLastWeek([]);
    expect(result.dungeon).toBeNull();
    expect(result.date).toBeNull();
  });

  it('finds the highest-XP workout from exactly 7 days ago', () => {
    const target = new Date();
    target.setHours(0, 0, 0, 0);
    target.setDate(target.getDate() - 7);
    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    const history = [
      { date: dateStr, xpEarned: 100, statXPEarned: { STR: 80, VIT: 20 } },
      { date: dateStr, xpEarned: 250, statXPEarned: { PER: 250 } },
    ];

    const result = getDungeonFromLastWeek(history);
    expect(result.date).toBe(dateStr);
    expect(result.dungeon).toEqual(pullDungeon);
  });

  it('returns null dungeon when no entry matches 7 days ago', () => {
    const result = getDungeonFromLastWeek([
      { date: '2020-01-01', xpEarned: 100, statXPEarned: { STR: 100 } },
    ]);
    expect(result.dungeon).toBeNull();
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('getWorkoutSuggestion', () => {
  it('suggests push day for first-time users', () => {
    const result = getWorkoutSuggestion([], {});
    expect(result.dungeon).toEqual(pushDungeon);
    expect(result.isFirstTime).toBe(true);
    expect(result.daysSinceLastWorked).toBeNull();
  });

  it('suggests a different split after a push workout', () => {
    const history = [
      {
        date: getTodayString(),
        xpEarned: 200,
        statXPEarned: { STR: 200 },
      },
    ];
    const result = getWorkoutSuggestion(history, { STR: 200 });
    // The engine should not recommend push again after a push day.
    expect(result.dungeon.id).not.toBe('push');
    expect(result.daysSinceLastWorked).toBeNull();
  });

  it('penalizes training the same muscle group on consecutive days', () => {
    const today = getTodayString();
    const history = [
      {
        date: today,
        xpEarned: 200,
        statXPEarned: { STR: 200 },
      },
    ];
    const result = getWorkoutSuggestion(history, { STR: 200 });
    expect(result.scores.push).toBeLessThan(result.scores.recovery);
  });

  it('includes alternatives and scores for every candidate dungeon', () => {
    const history = [
      {
        date: getTodayString(),
        xpEarned: 200,
        statXPEarned: { STR: 200 },
      },
    ];
    const result = getWorkoutSuggestion(history, { STR: 200 });
    expect(Object.keys(result.scores).sort()).toEqual(
      ['push', 'pull', 'legs', 'recovery', 'cardio'].sort()
    );
    expect(result.alternatives).toHaveLength(2);
    result.alternatives.forEach((alt) => {
      expect(alt.dungeon).toBeDefined();
      expect(typeof alt.reason).toBe('string');
    });
  });

  it('rewards under-trained stats', () => {
    const history = [
      {
        date: getTodayString(),
        xpEarned: 200,
        statXPEarned: { STR: 200 },
      },
    ];
    // PER is much lower than average -> pull should get a stat-balance boost.
    const result = getWorkoutSuggestion(history, { STR: 200, PER: 10 });
    expect(result.scores.pull).toBeGreaterThan(result.scores.push);
  });
});

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
