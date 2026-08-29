import {
  generateDailyQuests,
  shouldResetQuests,
  getTodayString,
} from '../../../src/utils/quests';

describe('generateDailyQuests', () => {
  it('returns 4 regular quests plus 1 bonus quest', () => {
    const quests = generateDailyQuests(new Date('2026-08-25T12:00:00Z'));
    expect(quests).toHaveLength(5);
    const bonus = quests.find((q) => q.isBonus);
    expect(bonus).toBeDefined();
    expect(bonus.stat).toBe('ALL');
  });

  it('produces deterministic quests for the same date', () => {
    const date = new Date('2026-08-25T08:00:00Z');
    const first = generateDailyQuests(date);
    const second = generateDailyQuests(date);
    expect(first).toEqual(second);
  });

  it('gives distinct stats for the 4 regular quests', () => {
    const quests = generateDailyQuests(new Date('2026-08-25T12:00:00Z'));
    const regular = quests.filter((q) => !q.isBonus);
    const stats = regular.map((q) => q.stat);
    expect(new Set(stats).size).toBe(4);
  });

  it('includes required fields on every quest', () => {
    const quests = generateDailyQuests(new Date('2026-08-25T12:00:00Z'));
    quests.forEach((q) => {
      expect(q.id).toMatch(/^quest_\d{4}-\d{2}-\d{2}_/);
      expect(typeof q.text).toBe('string');
      expect(typeof q.xpReward).toBe('number');
      expect(q.completed).toBe(false);
      expect(q.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('generates different quests for different dates', () => {
    const a = generateDailyQuests(new Date('2026-08-25T12:00:00Z'));
    const b = generateDailyQuests(new Date('2026-08-26T12:00:00Z'));
    // At least one ID should differ; full equality is unlikely for adjacent days.
    const aIds = a.map((q) => q.id).sort();
    const bIds = b.map((q) => q.id).sort();
    expect(aIds).not.toEqual(bIds);
  });

  it('uses the current date when called without arguments', () => {
    const quests = generateDailyQuests();
    expect(quests).toHaveLength(5);
    quests.forEach((q) => {
      expect(q.date).toBe(getTodayString());
    });
  });
});

describe('shouldResetQuests', () => {
  it('returns true when no lastQuestDate exists', () => {
    expect(shouldResetQuests(null)).toBe(true);
    expect(shouldResetQuests(undefined)).toBe(true);
  });

  it('returns false when lastQuestDate matches today', () => {
    expect(shouldResetQuests(getTodayString())).toBe(false);
  });

  it('returns true when lastQuestDate is not today', () => {
    expect(shouldResetQuests('2020-01-01')).toBe(true);
  });
});

describe('getTodayString', () => {
  it('returns YYYY-MM-DD in local timezone', () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    expect(getTodayString()).toBe(`${y}-${m}-${d}`);
  });

  it('does not shift the date based on UTC offset', () => {
    // Mock a timezone where local date differs from UTC date.
    const originalDate = global.Date;
    const mockedDate = class extends originalDate {
      constructor(...args) {
        super(...args);
      }
      getFullYear() { return 2026; }
      getMonth() { return 7; } // August (0-indexed)
      getDate() { return 25; }
    };
    global.Date = mockedDate;
    expect(getTodayString()).toBe('2026-08-25');
    global.Date = originalDate;
  });
});
