// Stretching routines organized by Push/Pull/Legs workout day

export const STRETCH_DAYS = [
  { id: 'push', label: 'Push Day', icon: 'arm-flex', description: 'Chest, Shoulders & Triceps' },
  { id: 'pull', label: 'Pull Day', icon: 'rowing', description: 'Back, Biceps & Forearms' },
  { id: 'legs', label: 'Legs Day', icon: 'hiking', description: 'Quads, Hamstrings & Calves' },
  { id: 'general', label: 'Cooldown', icon: 'yoga', description: 'Full Body Recovery' },
];

export const STRETCHES = [
  // ─── PUSH DAY ────────────────────────────
  {
    id: 'chest_opener',
    day: 'push',
    name: 'Chest Opener',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Clasp hands behind your back, squeeze shoulder blades together, lift chest up.',
  },
  {
    id: 'doorway_chest_stretch',
    day: 'push',
    name: 'Doorway Chest Stretch',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'Place forearm on door frame at 90°, lean forward gently until you feel a stretch in the pec.',
  },
  {
    id: 'overhead_tricep_stretch',
    day: 'push',
    name: 'Overhead Tricep Stretch',
    duration: 30,
    sides: true,
    icon: 'arm-flex',
    description: 'Raise one arm overhead, bend elbow. Use the other hand to gently press the elbow back.',
  },
  {
    id: 'cross_body_shoulder',
    day: 'push',
    name: 'Cross-Body Shoulder Stretch',
    duration: 30,
    sides: true,
    icon: 'arm-flex',
    description: 'Pull one arm across your chest with the opposite hand. Keep shoulder relaxed.',
  },
  {
    id: 'wrist_flexor_stretch',
    day: 'push',
    name: 'Wrist Flexor Stretch',
    duration: 20,
    sides: true,
    icon: 'hand-back-right',
    description: 'Extend arm with palm up, gently pull fingers back with the other hand.',
  },

  // ─── PULL DAY ────────────────────────────
  {
    id: 'lat_stretch',
    day: 'pull',
    name: 'Lat Stretch',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'Grab a pole or doorframe overhead, lean your hips away to stretch the lat.',
  },
  {
    id: 'standing_bicep_stretch',
    day: 'pull',
    name: 'Standing Bicep Stretch',
    duration: 25,
    sides: true,
    icon: 'arm-flex',
    description: 'Extend arm forward, palm up. Use the other hand to gently press fingers downward.',
  },
  {
    id: 'forearm_extensor_stretch',
    day: 'pull',
    name: 'Forearm Extensor Stretch',
    duration: 25,
    sides: true,
    icon: 'hand-back-right',
    description: 'Extend arm with palm down, gently pull fingers toward you with the other hand.',
  },
  {
    id: 'upper_back_stretch',
    day: 'pull',
    name: 'Upper Back Stretch',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Clasp hands in front, round your upper back, push hands forward. Chin to chest.',
  },
  {
    id: 'thread_the_needle',
    day: 'pull',
    name: 'Thread the Needle',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'On all fours, reach one arm under your body, rotating your thoracic spine.',
  },

  // ─── LEGS DAY ────────────────────────────
  {
    id: 'standing_quad_stretch',
    day: 'legs',
    name: 'Standing Quad Stretch',
    duration: 30,
    sides: true,
    icon: 'human',
    description: 'Stand on one leg, grab ankle behind you. Keep knees together, push hips forward.',
  },
  {
    id: 'standing_hamstring_stretch',
    day: 'legs',
    name: 'Standing Hamstring Stretch',
    duration: 30,
    sides: true,
    icon: 'human',
    description: 'Place heel on an elevated surface, hinge forward at the hips with a flat back.',
  },
  {
    id: 'hip_flexor_lunge',
    day: 'legs',
    name: 'Hip Flexor Lunge Stretch',
    duration: 30,
    sides: true,
    icon: 'walk',
    description: 'Kneel in a lunge position, push hips forward. Squeeze glute of the kneeling leg.',
  },
  {
    id: 'pigeon_pose_stretch',
    day: 'legs',
    name: 'Pigeon Pose',
    duration: 45,
    sides: true,
    icon: 'yoga',
    description: 'From a plank, bring one knee behind the wrist. Lower hips and hold. Deep hip opener.',
  },
  {
    id: 'calf_stretch',
    day: 'legs',
    name: 'Wall Calf Stretch',
    duration: 25,
    sides: true,
    icon: 'human',
    description: 'Place ball of foot against a wall, lean forward. Keep the heel grounded.',
  },
  {
    id: 'seated_butterfly',
    day: 'legs',
    name: 'Seated Butterfly',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Sit with soles of feet together, gently press knees down with elbows.',
  },

  // ─── GENERAL / COOLDOWN ──────────────────
  {
    id: 'neck_rolls',
    day: 'general',
    name: 'Neck Rolls',
    duration: 20,
    sides: false,
    icon: 'head-outline',
    description: 'Slowly roll your head in a circle. Switch direction halfway through.',
  },
  {
    id: 'childs_pose',
    day: 'general',
    name: "Child's Pose",
    duration: 45,
    sides: false,
    icon: 'yoga',
    description: 'Kneel and sit on heels, stretch arms forward on the floor. Breathe deeply.',
  },
  {
    id: 'seated_forward_fold',
    day: 'general',
    name: 'Seated Forward Fold',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Sit with legs extended, hinge at hips and reach for your toes. Keep back flat.',
  },
  {
    id: 'spinal_twist',
    day: 'general',
    name: 'Supine Spinal Twist',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'Lie on your back, bring one knee across the body. Extend opposite arm. Look away.',
  },
  {
    id: 'cat_cow',
    day: 'general',
    name: 'Cat-Cow Stretch',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'On all fours, alternate between arching (cow) and rounding (cat) your spine.',
  },
  {
    id: 'plank_hold',
    day: 'general',
    name: 'Plank Hold',
    duration: 60,
    sides: false,
    icon: 'human',
    description: 'Hold a high plank position. Keep hips level, core braced, don\'t let your lower back sag.',
  },
  {
    id: 'forearm_plank',
    day: 'general',
    name: 'Forearm Plank',
    duration: 45,
    sides: false,
    icon: 'human',
    description: 'Hold a forearm plank. Elbows under shoulders, body in a straight line. Breathe steadily.',
  },
];

export const getStretchesForDay = (dayId) => {
  return STRETCHES.filter((s) => s.day === dayId);
};

export const getStretchById = (id) => {
  return STRETCHES.find((s) => s.id === id);
};

// Calculate total time for a day (accounting for bilateral sides)
export const getTotalTimeForDay = (dayId) => {
  const stretches = getStretchesForDay(dayId);
  return stretches.reduce((total, s) => {
    return total + (s.sides ? s.duration * 2 : s.duration);
  }, 0);
};
