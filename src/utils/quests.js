// Daily Quest generation and management

const QUEST_TEMPLATES = [
  // STR quests
  { text: 'Complete {count} Push-ups', stat: 'STR', counts: [30, 50, 75, 100], xpReward: 50, exerciseId: 'push_ups' },
  { text: 'Do {count} Bicep Curls', stat: 'STR', counts: [20, 30, 40], xpReward: 40, exerciseId: 'bicep_curls' },
  { text: 'Perform {count} Tricep Dips', stat: 'STR', counts: [15, 25, 35], xpReward: 45, exerciseId: 'tricep_dips' },

  // VIT quests
  { text: 'Hold Plank for {count} seconds', stat: 'VIT', counts: [60, 90, 120, 180], xpReward: 50, exerciseId: 'plank' },
  { text: 'Complete {count} Crunches', stat: 'VIT', counts: [30, 50, 75], xpReward: 40, exerciseId: 'crunches' },
  { text: 'Do {count} Mountain Climbers', stat: 'VIT', counts: [30, 50, 60], xpReward: 45, exerciseId: 'mountain_climbers' },

  // AGI quests
  { text: 'Run for {count} minutes', stat: 'AGI', counts: [10, 15, 20, 30], xpReward: 60, exerciseId: 'running' },
  { text: 'Complete {count} Burpees', stat: 'AGI', counts: [10, 20, 30], xpReward: 55, exerciseId: 'burpees' },
  { text: 'Do {count} Jumping Jacks', stat: 'AGI', counts: [50, 75, 100], xpReward: 35, exerciseId: 'jumping_jacks' },

  // END quests
  { text: 'Complete {count} Squats', stat: 'END', counts: [30, 50, 75], xpReward: 50, exerciseId: 'squats' },
  { text: 'Do {count} Lunges', stat: 'END', counts: [20, 30, 40], xpReward: 45, exerciseId: 'lunges' },
  { text: 'Hold Wall Sit for {count} seconds', stat: 'END', counts: [45, 60, 90], xpReward: 40, exerciseId: 'wall_sit' },

  // INT quests
  { text: 'Complete {count} minutes of Yoga', stat: 'INT', counts: [10, 15, 20], xpReward: 45, exerciseId: 'yoga_flow' },
  { text: 'Do {count} minutes of Stretching', stat: 'INT', counts: [10, 15, 20], xpReward: 35, exerciseId: 'stretching' },

  // PER quests
  { text: 'Complete {count} Pull-ups', stat: 'PER', counts: [5, 10, 15, 20], xpReward: 55, exerciseId: 'pull_ups' },
  { text: 'Do {count} Bent-over Rows', stat: 'PER', counts: [15, 20, 30], xpReward: 45, exerciseId: 'rows' },
  { text: 'Perform {count} Lateral Raises', stat: 'PER', counts: [15, 20, 30], xpReward: 40, exerciseId: 'lateral_raises' },
];

/**
 * Generate a seeded pseudo-random number from a date string
 */
const seededRandom = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
};

/**
 * Generate daily quests - same quests for the same day (seeded by date)
 */
export const generateDailyQuests = (date = new Date()) => {
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const seed = seededRandom(dateStr);

  // Pick 4 quests from different stats
  const stats = ['STR', 'VIT', 'AGI', 'END', 'INT', 'PER'];
  const selectedStats = [];
  const tempSeed = seed;

  // Select 4 unique stats
  const shuffled = [...stats].sort((a, b) => {
    return seededRandom(dateStr + a) - seededRandom(dateStr + b);
  });
  const chosenStats = shuffled.slice(0, 4);

  const quests = chosenStats.map((stat, index) => {
    const statTemplates = QUEST_TEMPLATES.filter(q => q.stat === stat);
    const templateIdx = seededRandom(dateStr + stat + index) % statTemplates.length;
    const template = statTemplates[templateIdx];

    const countIdx = seededRandom(dateStr + template.text) % template.counts.length;
    const count = template.counts[countIdx];

    return {
      id: `quest_${dateStr}_${index}`,
      text: template.text.replace('{count}', count),
      stat: template.stat,
      xpReward: template.xpReward,
      exerciseId: template.exerciseId,
      completed: false,
      count,
      date: dateStr,
    };
  });

  // Add a bonus quest
  quests.push({
    id: `quest_${dateStr}_bonus`,
    text: 'Complete all daily quests',
    stat: 'ALL',
    xpReward: 100,
    exerciseId: null,
    completed: false,
    isBonus: true,
    date: dateStr,
  });

  return quests;
};

/**
 * Check if quests need to be reset (new day)
 */
export const shouldResetQuests = (lastQuestDate) => {
  if (!lastQuestDate) return true;
  const today = new Date().toISOString().split('T')[0];
  return lastQuestDate !== today;
};

/**
 * Get today's date string
 */
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};
