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
    feel: 'A mild, even pull across the front of the chest and shoulders. Should feel easy and open, never sharp.',
  },
  {
    id: 'doorway_chest_stretch',
    day: 'push',
    name: 'Doorway Chest Stretch',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'Place forearm on door frame at 90°, lean forward gently until you feel a stretch in the pec.',
    feel: 'A steady, even pull through the front of the shoulder and pec on the stretched side. Lean only until it feels firm, not painful.',
  },
  {
    id: 'overhead_tricep_stretch',
    day: 'push',
    name: 'Overhead Tricep Stretch',
    duration: 30,
    sides: true,
    icon: 'arm-flex',
    description: 'Raise one arm overhead, bend elbow. Use the other hand to gently press the elbow back.',
    feel: 'A long, controlled pull along the back of the upper arm. If the shoulder pinches, ease the pressure and drop the elbow a little.',
  },
  {
    id: 'cross_body_shoulder',
    day: 'push',
    name: 'Cross-Body Shoulder Stretch',
    duration: 30,
    sides: true,
    icon: 'arm-flex',
    description: 'Pull one arm across your chest with the opposite hand. Keep shoulder relaxed.',
    feel: 'A soft, even tension across the top of the shoulder and upper arm. The joint itself should stay loose, not squeezed.',
  },
  {
    id: 'wrist_flexor_stretch',
    day: 'push',
    name: 'Wrist Flexor Stretch',
    duration: 20,
    sides: true,
    icon: 'hand-back-right',
    description: 'Extend arm with palm up, gently pull fingers back with the other hand.',
    feel: 'A gentle stretch along the inner forearm and wrist. Stop if you feel any tingling or numbness in the hand.',
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
    feel: 'A deep, even pull down the side of the torso, from underarm to the hip. The stretch deepens as your hips shift back.',
  },
  {
    id: 'standing_bicep_stretch',
    day: 'pull',
    name: 'Standing Bicep Stretch',
    duration: 25,
    sides: true,
    icon: 'arm-flex',
    description: 'Extend arm forward, palm up. Use the other hand to gently press fingers downward.',
    feel: 'A focused pull through the bicep and the front of the shoulder. Keep the elbow pointing forward, not out to the side.',
  },
  {
    id: 'forearm_extensor_stretch',
    day: 'pull',
    name: 'Forearm Extensor Stretch',
    duration: 25,
    sides: true,
    icon: 'hand-back-right',
    description: 'Extend arm with palm down, gently pull fingers toward you with the other hand.',
    feel: 'A firm but mild stretch across the top of the forearm and wrist. Any tingling means to back off the pressure.',
  },
  {
    id: 'upper_back_stretch',
    day: 'pull',
    name: 'Upper Back Stretch',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Clasp hands in front, round your upper back, push hands forward. Chin to chest.',
    feel: 'A broad, even stretch across the upper back and between the shoulder blades. Rounding deeper should feel smooth, not pinchy.',
  },
  {
    id: 'thread_the_needle',
    day: 'pull',
    name: 'Thread the Needle',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'On all fours, reach one arm under your body, rotating your thoracic spine.',
    feel: 'A twisting stretch through the mid-back on the reaching side. Ease the rotation until it feels deep, never sharp.',
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
    feel: 'A strong pull along the front of the thigh, from the hip toward the knee. If the lower back aches, you are leaning too far back.',
  },
  {
    id: 'standing_hamstring_stretch',
    day: 'legs',
    name: 'Standing Hamstring Stretch',
    duration: 30,
    sides: true,
    icon: 'human',
    description: 'Place heel on an elevated surface, hinge forward at the hips with a flat back.',
    feel: 'A long, controlled stretch along the back of the thigh toward the hamstring. Hinge from the hips, and keep the sensation in the leg, not the lower back.',
  },
  {
    id: 'hip_flexor_lunge',
    day: 'legs',
    name: 'Hip Flexor Lunge Stretch',
    duration: 30,
    sides: true,
    icon: 'walk',
    description: 'Kneel in a lunge position, push hips forward. Squeeze glute of the kneeling leg.',
    feel: 'A deep pull at the front of the hip of the kneeling leg. Squeeze the glute to sharpen it — the feeling should sit in the hip, not the low back.',
  },
  {
    id: 'pigeon_pose_stretch',
    day: 'legs',
    name: 'Pigeon Pose',
    duration: 45,
    sides: true,
    icon: 'yoga',
    description: 'From a plank, bring one knee behind the wrist. Lower hips and hold. Deep hip opener.',
    feel: 'A deep, wide stretch through the outer hip and glute. Intensity can build gradually — settle into it with your breath instead of forcing the depth.',
  },
  {
    id: 'calf_stretch',
    day: 'legs',
    name: 'Wall Calf Stretch',
    duration: 25,
    sides: true,
    icon: 'human',
    description: 'Place ball of foot against a wall, lean forward. Keep the heel grounded.',
    feel: 'A firm, narrow stretch in the calf with the heel planted. Bending the knee slightly shifts the feeling deeper into the muscle.',
  },
  {
    id: 'seated_butterfly',
    day: 'legs',
    name: 'Seated Butterfly',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Sit with soles of feet together, gently press knees down with elbows.',
    feel: 'A gentle, even release through the inner thighs. It should feel mild — press only as far as stays comfortable.',
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
    feel: 'Light, smooth movement through the neck — a mild release at the base of the skull and along the side of the neck. No forcing or bouncing.',
  },
  {
    id: 'childs_pose',
    day: 'general',
    name: "Child's Pose",
    duration: 45,
    sides: false,
    icon: 'yoga',
    description: 'Kneel and sit on heels, stretch arms forward on the floor. Breathe deeply.',
    feel: 'A calm, full stretch across the upper back and shoulders, easing deeper with each exhale. It should feel restorative, not strained.',
  },
  {
    id: 'seated_forward_fold',
    day: 'general',
    name: 'Seated Forward Fold',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'Sit with legs extended, hinge at hips and reach for your toes. Keep back flat.',
    feel: 'A long pull down the back of both legs. A little calf tightness is normal — hinge from the hips rather than rounding the back.',
  },
  {
    id: 'spinal_twist',
    day: 'general',
    name: 'Supine Spinal Twist',
    duration: 30,
    sides: true,
    icon: 'yoga',
    description: 'Lie on your back, bring one knee across the body. Extend opposite arm. Look away.',
    feel: 'A gentle rotation through the spine, strongest between the shoulder blades. Let the knee sink toward the floor with each breath.',
  },
  {
    id: 'cat_cow',
    day: 'general',
    name: 'Cat-Cow Stretch',
    duration: 30,
    sides: false,
    icon: 'yoga',
    description: 'On all fours, alternate between arching (cow) and rounding (cat) your spine.',
    feel: 'A wave of ease moving down the spine — light stretch in the lower back at the top, a mild stretch across the upper back at the bottom. Slow and controlled.',
  },
  {
    id: 'plank_hold',
    day: 'general',
    name: 'Plank Hold',
    duration: 60,
    sides: false,
    icon: 'human',
    description: 'Hold a high plank position. Keep hips level, core braced, don\'t let your lower back sag.',
    feel: 'Steady muscular burn through the core, shoulders, and arms. Form should stay rigid — the shake and heat come from the hold, not from sagging.',
  },
  {
    id: 'forearm_plank',
    day: 'general',
    name: 'Forearm Plank',
    duration: 45,
    sides: false,
    icon: 'human',
    description: 'Hold a forearm plank. Elbows under shoulders, body in a straight line. Breathe steadily.',
    feel: 'A deeper, more concentrated core burn than the high plank, with the shoulders and arms engaged. Keep breathing — breath-holding is a sign you are at the edge of form.',
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
