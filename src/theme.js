// Solo Leveling Gym - Design System
// Dark neon aesthetic inspired by Solo Leveling System UI

export const COLORS = {
  // Backgrounds
  background: '#0a0a0f',
  surface: '#12121a',
  surfaceLight: '#1a1a2e',
  surfaceBorder: '#2a2a3e',

  // Primary - Electric Blue (System UI)
  primary: '#4a7dff',
  primaryDark: '#3366e0',
  primaryGlow: 'rgba(74, 125, 255, 0.3)',

  // Accent - Neon Purple (Shadow Monarch)
  accent: '#b44aff',
  accentDark: '#9933e0',
  accentGlow: 'rgba(180, 74, 255, 0.3)',

  // Shadow Violet
  shadowViolet: '#2a1a4e',
  shadowVioletGlow: 'rgba(42, 26, 78, 0.5)',

  // Text
  textPrimary: '#e8e8f0',
  textSecondary: '#8888a0',
  textMuted: '#555570',

  // Status
  success: '#00e676',
  successGlow: 'rgba(0, 230, 118, 0.3)',
  danger: '#ff4757',
  dangerGlow: 'rgba(255, 71, 87, 0.3)',
  warning: '#ffa502',
  warningGlow: 'rgba(255, 165, 2, 0.3)',

  // Stat Colors
  statSTR: '#ff4757',
  statVIT: '#00e676',
  statAGI: '#00d2d3',
  statEND: '#ff6b35',
  statINT: '#7c4dff',
  statPER: '#ffb142',

  // Rank Colors
  rankE: '#888899',
  rankD: '#4cd137',
  rankC: '#4a7dff',
  rankB: '#b44aff',
  rankA: '#ff6b35',
  rankS: '#ffd700',
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
  heading: 'Rajdhani_700Bold',
  headingMedium: 'Rajdhani_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
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
  glow: (color = COLORS.primary, intensity = 0.3) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: intensity,
    shadowRadius: 12,
    elevation: 8,
  }),
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
};

export const GRADIENTS = {
  primary: [COLORS.primaryDark, COLORS.primary],
  accent: [COLORS.accentDark, COLORS.accent],
  surface: [COLORS.surface, COLORS.surfaceLight],
  dark: ['#0a0a0f', '#12121a'],
  rankE: ['#666677', '#888899'],
  rankD: ['#2d8a1e', '#4cd137'],
  rankC: ['#3366e0', '#4a7dff'],
  rankB: ['#8a2be2', '#b44aff'],
  rankA: ['#cc5500', '#ff6b35'],
  rankS: ['#cc9900', '#ffd700'],
};
