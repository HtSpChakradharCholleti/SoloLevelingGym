// Exercise database - each exercise maps to a stat and dungeon (muscle group)

export const DUNGEONS = [
  {
    id: 'back_bicep',
    name: 'Shadow Spire',
    subtitle: 'Back & Biceps',
    stat: 'PER',
    icon: 'arm-flex',
    rank: 'D',
    description: 'Rise from the darkness, strengthen your pull and arms.',
  },
  {
    id: 'chest_tricep',
    name: 'Crimson Fortress',
    subtitle: 'Chest & Triceps',
    stat: 'STR',
    icon: 'dumbbell',
    rank: 'D',
    description: 'Break through the gates of raw power and push beyond limits.',
  },
  {
    id: 'legs_shoulders',
    name: 'Titan\'s Path',
    subtitle: 'Legs & Shoulders',
    stat: 'END',
    icon: 'hiking',
    rank: 'C',
    description: 'Walk the path of giants and forge unbreakable power.',
  },
  {
    id: 'cardio',
    name: 'Wind Temple',
    subtitle: 'Cardio',
    stat: 'AGI',
    icon: 'run-fast',
    rank: 'C',
    description: 'Chase the speed of shadows, build your agility.',
  },
  {
    id: 'core',
    name: 'Iron Sanctum',
    subtitle: 'Core & Abs',
    stat: 'VIT',
    icon: 'shield-half-full',
    rank: 'D',
    description: 'Forge an unbreakable core within.',
  },
  {
    id: 'warmup_stretching',
    name: 'Arcane Grove',
    subtitle: 'Warmup & Stretching',
    stat: 'INT',
    icon: 'yoga',
    rank: 'E',
    description: 'Prepare your body and unlock hidden potential.',
  },
];

export const EXERCISES = [
  // PER - Back & Biceps (Shadow Spire)
  { id: 'pull_ups', name: 'Pull-ups', dungeonId: 'back_bicep', stat: 'PER', baseXP: 25, defaultSets: 3, defaultReps: 8, icon: 'arm-flex' },
  { id: 'rows', name: 'Bent-over Rows', dungeonId: 'back_bicep', stat: 'PER', baseXP: 22, defaultSets: 3, defaultReps: 10, icon: 'dumbbell' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', dungeonId: 'back_bicep', stat: 'PER', baseXP: 20, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'bicep_curls', name: 'Bicep Curls', dungeonId: 'back_bicep', stat: 'PER', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'hammer_curls', name: 'Hammer Curls', dungeonId: 'back_bicep', stat: 'PER', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },

  // STR - Chest & Triceps (Crimson Fortress)
  { id: 'bench_press', name: 'Bench Press', dungeonId: 'chest_tricep', stat: 'STR', baseXP: 25, defaultSets: 4, defaultReps: 10, icon: 'dumbbell' },
  { id: 'push_ups', name: 'Push-ups', dungeonId: 'chest_tricep', stat: 'STR', baseXP: 15, defaultSets: 3, defaultReps: 15, icon: 'arm-flex' },
  { id: 'chest_fly', name: 'Chest Fly', dungeonId: 'chest_tricep', stat: 'STR', baseXP: 20, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'tricep_dips', name: 'Tricep Dips', dungeonId: 'chest_tricep', stat: 'STR', baseXP: 18, defaultSets: 3, defaultReps: 12, icon: 'arm-flex' },
  { id: 'tricep_extensions', name: 'Tricep Extensions', dungeonId: 'chest_tricep', stat: 'STR', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },

  // END - Legs & Shoulders (Titan's Path)
  { id: 'squats', name: 'Squats', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 20, defaultSets: 4, defaultReps: 15, icon: 'human' },
  { id: 'lunges', name: 'Lunges', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 18, defaultSets: 3, defaultReps: 12, icon: 'walk' },
  { id: 'leg_press', name: 'Leg Press', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 25, defaultSets: 4, defaultReps: 12, icon: 'human' },
  { id: 'shoulder_press', name: 'Shoulder Press', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 22, defaultSets: 3, defaultReps: 10, icon: 'dumbbell' },
  { id: 'lateral_raises', name: 'Lateral Raises', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'calf_raises', name: 'Calf Raises', dungeonId: 'legs_shoulders', stat: 'END', baseXP: 12, defaultSets: 3, defaultReps: 20, icon: 'human' },

  // AGI - Cardio (Wind Temple)
  { id: 'running', name: 'Running', dungeonId: 'cardio', stat: 'AGI', baseXP: 30, defaultSets: 1, defaultReps: 30, icon: 'run-fast' },
  { id: 'burpees', name: 'Burpees', dungeonId: 'cardio', stat: 'AGI', baseXP: 25, defaultSets: 3, defaultReps: 10, icon: 'run-fast' },
  { id: 'jump_rope', name: 'Jump Rope', dungeonId: 'cardio', stat: 'AGI', baseXP: 20, defaultSets: 3, defaultReps: 50, icon: 'jump-rope' },

  // VIT - Core & Abs (Iron Sanctum)
  { id: 'plank', name: 'Plank', dungeonId: 'core', stat: 'VIT', baseXP: 20, defaultSets: 3, defaultReps: 60, icon: 'human' },
  { id: 'leg_raises', name: 'Leg Raises', dungeonId: 'core', stat: 'VIT', baseXP: 15, defaultSets: 3, defaultReps: 15, icon: 'human' },
  { id: 'russian_twists', name: 'Russian Twists', dungeonId: 'core', stat: 'VIT', baseXP: 14, defaultSets: 3, defaultReps: 20, icon: 'human' },

  // INT - Warmup & Stretching (Arcane Grove)
  { id: 'dynamic_warmup', name: 'Dynamic Warmup', dungeonId: 'warmup_stretching', stat: 'INT', baseXP: 15, defaultSets: 1, defaultReps: 10, icon: 'human-handsup' },
  { id: 'yoga_flow', name: 'Yoga Flow', dungeonId: 'warmup_stretching', stat: 'INT', baseXP: 20, defaultSets: 1, defaultReps: 15, icon: 'yoga' },
  { id: 'stretching', name: 'Full Stretch', dungeonId: 'warmup_stretching', stat: 'INT', baseXP: 15, defaultSets: 1, defaultReps: 10, icon: 'yoga' },
];

export const getExercisesForDungeon = (dungeonId) => {
  return EXERCISES.filter(e => e.dungeonId === dungeonId);
};

export const getExerciseById = (id) => {
  return EXERCISES.find(e => e.id === id);
};

export const getDungeonById = (id) => {
  return DUNGEONS.find(d => d.id === id);
};
