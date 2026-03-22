// Solo Leveling Gym - Design System
// Dark neon aesthetic inspired by Solo Leveling System UI

export const COLORS = {
  // Backgrounds - CRED inspired ultra-dark
  background: '#040405',
  surface: '#121215',
  surfaceLight: '#18181b',
  surfaceBorder: '#222226',

  // Primary & Accent (Subtler metallic/neon tones)
  primary: '#e8e8f0', // Crisp white/silver
  primaryDark: '#8888a0',
  primaryGlow: 'rgba(232, 232, 240, 0.1)',

  accent: '#cba153', // CRED-like gold/copper accent
  accentDark: '#8e6b2c',
  accentGlow: 'rgba(203, 161, 83, 0.15)',

  // Text
  textPrimary: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted: '#52525b',

  // Status
  success: '#10b981',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  danger: '#ef4444',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  warning: '#fadd60',
  warningGlow: 'rgba(250, 221, 96, 0.15)',

  // Stat Colors - Consolidated to System Silver/Blue
  statSTR: '#94a3b8',
  statVIT: '#94a3b8',
  statAGI: '#94a3b8',
  statEND: '#94a3b8',
  statINT: '#94a3b8',
  statPER: '#94a3b8',

  // Rank Colors - Cohesive metallic progression
  rankE: '#3f3f46', // Zinc-700
  rankD: '#52525b', // Zinc-600
  rankC: '#71717a', // Zinc-500
  rankB: '#a1a1aa', // Zinc-400
  rankA: '#d4d4d8', // Zinc-300
  rankS: '#e8e8f0', // Primary Silver
};

export const RANK_COLORS = {
  E: COLORS.rankE,
  D: COLORS.rankD,
  C: COLORS.rankC,
  B: COLORS.rankB,
  A: COLORS.rankA,
  S: COLORS.rankS,
};

export const STAT_COLORS = {
  STR: COLORS.statSTR,
  VIT: COLORS.statVIT,
  AGI: COLORS.statAGI,
  END: COLORS.statEND,
  INT: COLORS.statINT,
  PER: COLORS.statPER,
};

export const STAT_LABELS = {
  STR: 'Strength',
  VIT: 'Vitality',
  AGI: 'Agility',
  END: 'Endurance',
  INT: 'Intelligence',
  PER: 'Perception',
};

export const STAT_DESCRIPTIONS = {
  STR: 'Chest & Arms',
  VIT: 'Core & Abs',
  AGI: 'Cardio',
  END: 'Legs',
  INT: 'Flexibility',
  PER: 'Back & Shoulders',
};

export const FONTS = {
  heading: 'Outfit_700Bold',
  headingMedium: 'Outfit_600SemiBold',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
};

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
  giant: 48,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  round: 100,
};

export const SHADOWS = {
  glow: (color = COLORS.primary, intensity = 0.15) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: intensity,
    shadowRadius: 16,
    elevation: 4,
  }),
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  inner: { // Simulated inner bevel for neumorphism
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  }
};

export const GRADIENTS = {
  primary: [COLORS.surfaceBorder, COLORS.surface],
  accent: [COLORS.accentDark, COLORS.accent],
  surface: ['#121215', '#0a0a0c'], // Deep sleek background
  dark: ['#040405', '#121215'],
  rankE: ['#18181b', '#3f3f46'],
  rankD: ['#27272a', '#52525b'],
  rankC: ['#3f3f46', '#71717a'],
  rankB: ['#52525b', '#a1a1aa'],
  rankA: ['#71717a', '#d4d4d8'],
  rankS: ['#a1a1aa', '#e8e8f0'],
};
