# SoloLevelingGym: Agent Instructions for Code Generation

**Scope:** React Native Expo app — SoloLevelingGym
**Purpose:** Guidelines for agents to write code matching this project's patterns

---

## Architecture Layer Rules

### Component Layer
**Rule:** Flat `components/` directory — no subdirectories
- All reusable UI components live in `src/components/`
- Components are functional with React hooks
- Each component is a single file with `export default`

**Rule:** All components have **PropTypes**, **defaultProps**, and **JSDoc**
```javascript
/**
 * Brief description of what this component does
 * @param { string } title - What this param controls
 * @param { bool } disabled - When this is true
 * @param { function } onPress - Callback when user does action
 */
const ComponentName = ({ title, disabled = false, onPress }) => {
  // ...
};

ComponentName.propTypes = {
  title: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
};

ComponentName.defaultProps = {
  disabled: false,
  onPress: () => {},
};

export default ComponentName;
```

### Screen Layer
**Rule:** All screens live in `src/screens/`
- Screen files use PascalCase with `Screen` suffix: `HistoryScreen.js`, `WorkoutScreen.js`
- Screens are functional components with `export default`
- Screens consume state via `usePlayer()` hook

### State Layer
**Rule:** Three-layer state management (no Redux)
1. **PlayerContext** — App-wide state via `useReducer` + `useContext`
2. **MMKV** — Disk persistence via `react-native-mmkv` (auto-persisted by PlayerContext)
3. **Component state** — Local UI state via `useState` / `useRef`

### Utility Layer
**Rule:** Centralized modules in `src/utils/`
- `SoundManager.js` — Audio playback with haptic feedback
- `NotificationManager.js` — Push notification scheduling
- `leveling.js` — XP calculation and rank progression
- `quests.js` — Daily quest generation logic
- `suggestions.js` — Workout suggestion engine

### Design Token Layer
**Rule:** Single source of truth: `src/theme.js`
- `COLORS` — All color values
- `FONTS` — Font family names (Outfit)
- `FONT_SIZES` — Text size scale
- `SPACING` — Margin/padding scale
- `BORDER_RADIUS` — Border radius scale
- `SHADOWS` — Shadow presets
- `GRADIENTS` — Gradient color arrays
- `RANK_COLORS`, `STAT_COLORS` — Domain-specific color maps

---

## Styling Rules

### Rule: NEVER hardcode colors, fonts, or sizes
- ❌ Bad: `color: '#E74C3C'`
- ✅ Good: `color: COLORS.danger`

### Rule: Use theme.js for all design tokens
```javascript
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

// Colors
backgroundColor: COLORS.surface
color: COLORS.textPrimary
borderColor: COLORS.surfaceBorder

// Sizes & Spacing
fontSize: FONT_SIZES.md          // 14
padding: SPACING.base            // 16

// Fonts
fontFamily: FONTS.heading        // 'Outfit_700Bold'
fontFamily: FONTS.body           // 'Outfit_400Regular'

// Shadows
...SHADOWS.soft                  // Pre-configured shadow
```

### Rule: Use StyleSheet.create() for all styles
```javascript
const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
  },
});
```

### Rule: Never use inline styles for production code
- ❌ Bad: `style={{ color: 'red' }}`
- ✅ Good: Extract to `const styles = StyleSheet.create()`

---

## Component Rules

### Rule: All reusable components must have JSDoc
```javascript
/**
 * Brief description of what this component does
 * @param { string } title - What this param controls
 * @param { bool } disabled - When this is true
 * @param { function } onPress - When user does action
 */
```

### Rule: Functional components with hooks
```javascript
const ComponentName = ({ prop1, prop2 = 'default' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = usePlayer();

  // ...
  return <View>...</View>;
};
```

### Rule: Component names are PascalCase
- Components: `DungeonCard.js`, `StatBar.js`, `ExerciseItem.js`
- Screens: `HunterProfileScreen.js`, `WorkoutScreen.js`

### Rule: Use props for variants, not separate components
- ❌ Bad: Create `ActiveQuestCard.js`, `CompletedQuestCard.js`
- ✅ Good: `<QuestCard quest={quest} />` with `quest.completed` controlling styling

### Rule: Animations must respect settings
```javascript
const { settings } = usePlayer();
const animationsEnabled = settings?.animationsEnabled ?? true;

// Reanimated entry animations
entering={animationsEnabled ? FadeInUp.delay(index * 100).duration(600) : undefined}

// RN Animated sequences
useEffect(() => {
  if (!animationsEnabled) return;
  Animated.timing(value, { ... }).start();
}, [animationsEnabled]);
```

---

## Navigation Rules

**Library:** `@react-navigation` (Bottom Tabs + Stack)

### Rule: Tab structure
```
MainTabs (Bottom Tab Navigator)
├── Profile → HunterProfileScreen
├── Quests → DailyQuestsScreen
├── Dungeons → DungeonsScreen
├── Workout → WorkoutScreen (conditionally shown)
└── History → HistoryScreen

Stack Navigator (wraps tabs)
├── Main → MainTabs
├── Stretching → StretchingScreen
└── WeightHistory → WeightHistoryScreen
```

### Rule: Navigate via navigation prop or useNavigation()
```javascript
navigation.navigate('Stretching', { dungeonId: 'flex' });
navigation.goBack();
```

---

## Import Order Rules

### Rule: Structured import groups with comments
```javascript
// React & React Native
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Third-party
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

// Components
import SystemPanel from '../components/SystemPanel';
```

---

## Checklist for New Components

- [ ] File in `src/components/`
- [ ] PascalCase filename
- [ ] Default export
- [ ] JSDoc comment
- [ ] PropTypes defined
- [ ] defaultProps defined
- [ ] All colors from `COLORS`
- [ ] All sizes from `SPACING` / `FONT_SIZES`
- [ ] All fonts from `FONTS`
- [ ] Styles via StyleSheet.create()
- [ ] Animations respect `settings.animationsEnabled`
- [ ] Structured import order with comments

## Checklist for New Screens

- [ ] File in `src/screens/`
- [ ] PascalCase filename with `Screen` suffix
- [ ] Default export
- [ ] Uses `usePlayer()` for state
- [ ] All design tokens from `theme.js`
- [ ] Handles empty/loading states
- [ ] Animations respect `settings.animationsEnabled`
- [ ] Structured import order with comments
