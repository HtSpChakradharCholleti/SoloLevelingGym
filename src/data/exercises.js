// Exercise database - each exercise maps to a stat and dungeon (muscle group)

export const DUNGEONS = [
  {
    id: 'chest_arms',
    name: 'Crimson Fortress',
    subtitle: 'Chest & Arms',
    stat: 'STR',
    icon: 'dumbbell',
    rank: 'D',
    description: 'Break through the gates of raw power',
  },
  {
    id: 'core',
    name: 'Iron Sanctum',
    subtitle: 'Core & Abs',
    stat: 'VIT',
    icon: 'shield-half-full',
    rank: 'D',
    description: 'Forge an unbreakable core within',
  },
  {
    id: 'cardio',
    name: 'Wind Temple',
    subtitle: 'Cardio',
    stat: 'AGI',
    icon: 'run-fast',
    rank: 'C',
    description: 'Chase the speed of shadows',
  },
  {
    id: 'legs',
    name: 'Titan\'s Path',
    subtitle: 'Legs',
    stat: 'END',
    icon: 'hiking',
    rank: 'C',
    description: 'Walk the path of giants',
  },
  {
    id: 'flexibility',
    name: 'Arcane Grove',
    subtitle: 'Flexibility',
    stat: 'INT',
    icon: 'yoga',
    rank: 'E',
    description: 'Unlock the body\'s hidden potential',
  },
  {
    id: 'back_shoulders',
    name: 'Shadow Spire',
    subtitle: 'Back & Shoulders',
    stat: 'PER',
    icon: 'arm-flex',
    rank: 'D',
    description: 'Rise from the darkness, ascend',
  },
];

export const EXERCISES = [
  // STR - Chest & Arms
  { id: 'push_ups', name: 'Push-ups', dungeonId: 'chest_arms', stat: 'STR', baseXP: 15, defaultSets: 3, defaultReps: 15, icon: 'arm-flex' },
  { id: 'bench_press', name: 'Bench Press', dungeonId: 'chest_arms', stat: 'STR', baseXP: 25, defaultSets: 4, defaultReps: 10, icon: 'dumbbell' },
  { id: 'bicep_curls', name: 'Bicep Curls', dungeonId: 'chest_arms', stat: 'STR', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'tricep_dips', name: 'Tricep Dips', dungeonId: 'chest_arms', stat: 'STR', baseXP: 18, defaultSets: 3, defaultReps: 12, icon: 'arm-flex' },
  { id: 'chest_fly', name: 'Chest Fly', dungeonId: 'chest_arms', stat: 'STR', baseXP: 20, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'diamond_pushups', name: 'Diamond Push-ups', dungeonId: 'chest_arms', stat: 'STR', baseXP: 20, defaultSets: 3, defaultReps: 10, icon: 'arm-flex' },

  // VIT - Core & Abs
  { id: 'plank', name: 'Plank', dungeonId: 'core', stat: 'VIT', baseXP: 20, defaultSets: 3, defaultReps: 60, icon: 'human' },
  { id: 'crunches', name: 'Crunches', dungeonId: 'core', stat: 'VIT', baseXP: 12, defaultSets: 3, defaultReps: 20, icon: 'human' },
  { id: 'leg_raises', name: 'Leg Raises', dungeonId: 'core', stat: 'VIT', baseXP: 15, defaultSets: 3, defaultReps: 15, icon: 'human' },
  { id: 'mountain_climbers', name: 'Mountain Climbers', dungeonId: 'core', stat: 'VIT', baseXP: 18, defaultSets: 3, defaultReps: 20, icon: 'run-fast' },
  { id: 'russian_twists', name: 'Russian Twists', dungeonId: 'core', stat: 'VIT', baseXP: 14, defaultSets: 3, defaultReps: 20, icon: 'human' },
  { id: 'bicycle_crunches', name: 'Bicycle Crunches', dungeonId: 'core', stat: 'VIT', baseXP: 16, defaultSets: 3, defaultReps: 20, icon: 'human' },

  // AGI - Cardio
  { id: 'running', name: 'Running', dungeonId: 'cardio', stat: 'AGI', baseXP: 30, defaultSets: 1, defaultReps: 30, icon: 'run-fast' },
  { id: 'burpees', name: 'Burpees', dungeonId: 'cardio', stat: 'AGI', baseXP: 25, defaultSets: 3, defaultReps: 10, icon: 'run-fast' },
  { id: 'jumping_jacks', name: 'Jumping Jacks', dungeonId: 'cardio', stat: 'AGI', baseXP: 12, defaultSets: 3, defaultReps: 30, icon: 'human-handsup' },
  { id: 'high_knees', name: 'High Knees', dungeonId: 'cardio', stat: 'AGI', baseXP: 15, defaultSets: 3, defaultReps: 30, icon: 'run-fast' },
  { id: 'jump_rope', name: 'Jump Rope', dungeonId: 'cardio', stat: 'AGI', baseXP: 20, defaultSets: 3, defaultReps: 50, icon: 'jump-rope' },
  { id: 'shadow_boxing', name: 'Shadow Boxing', dungeonId: 'cardio', stat: 'AGI', baseXP: 22, defaultSets: 3, defaultReps: 60, icon: 'boxing-glove' },

  // END - Legs
  { id: 'squats', name: 'Squats', dungeonId: 'legs', stat: 'END', baseXP: 20, defaultSets: 4, defaultReps: 15, icon: 'human' },
  { id: 'lunges', name: 'Lunges', dungeonId: 'legs', stat: 'END', baseXP: 18, defaultSets: 3, defaultReps: 12, icon: 'walk' },
  { id: 'calf_raises', name: 'Calf Raises', dungeonId: 'legs', stat: 'END', baseXP: 12, defaultSets: 3, defaultReps: 20, icon: 'human' },
  { id: 'wall_sit', name: 'Wall Sit', dungeonId: 'legs', stat: 'END', baseXP: 18, defaultSets: 3, defaultReps: 45, icon: 'seat' },
  { id: 'leg_press', name: 'Leg Press', dungeonId: 'legs', stat: 'END', baseXP: 25, defaultSets: 4, defaultReps: 12, icon: 'human' },
  { id: 'box_jumps', name: 'Box Jumps', dungeonId: 'legs', stat: 'END', baseXP: 22, defaultSets: 3, defaultReps: 10, icon: 'arrow-up-bold' },

  // INT - Flexibility
  { id: 'yoga_flow', name: 'Yoga Flow', dungeonId: 'flexibility', stat: 'INT', baseXP: 20, defaultSets: 1, defaultReps: 15, icon: 'yoga' },
  { id: 'stretching', name: 'Full Stretch', dungeonId: 'flexibility', stat: 'INT', baseXP: 15, defaultSets: 1, defaultReps: 10, icon: 'yoga' },
  { id: 'foam_rolling', name: 'Foam Rolling', dungeonId: 'flexibility', stat: 'INT', baseXP: 12, defaultSets: 1, defaultReps: 10, icon: 'yoga' },
  { id: 'pigeon_pose', name: 'Pigeon Pose', dungeonId: 'flexibility', stat: 'INT', baseXP: 14, defaultSets: 2, defaultReps: 30, icon: 'yoga' },
  { id: 'hamstring_stretch', name: 'Hamstring Stretch', dungeonId: 'flexibility', stat: 'INT', baseXP: 10, defaultSets: 2, defaultReps: 30, icon: 'yoga' },

  // PER - Back & Shoulders
  { id: 'pull_ups', name: 'Pull-ups', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 25, defaultSets: 3, defaultReps: 8, icon: 'arm-flex' },
  { id: 'shoulder_press', name: 'Shoulder Press', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 22, defaultSets: 3, defaultReps: 10, icon: 'dumbbell' },
  { id: 'lat_pulldown', name: 'Lat Pulldown', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 20, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'rows', name: 'Bent-over Rows', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 22, defaultSets: 3, defaultReps: 10, icon: 'dumbbell' },
  { id: 'lateral_raises', name: 'Lateral Raises', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 15, defaultSets: 3, defaultReps: 12, icon: 'dumbbell' },
  { id: 'face_pulls', name: 'Face Pulls', dungeonId: 'back_shoulders', stat: 'PER', baseXP: 15, defaultSets: 3, defaultReps: 15, icon: 'dumbbell' },
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
