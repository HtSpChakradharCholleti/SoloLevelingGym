# SoloLevelingGym: Code Patterns & Conventions Guide

## Quick Reference Rules

### ✅ DO's

1. **Use theme.js for ALL Design Tokens**
   ```javascript
   import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';
   ```

2. **Use Functional Components with Hooks**
   ```javascript
   const ComponentName = ({ prop1, prop2 = 'default' }) => {
     const [isLoading, setIsLoading] = useState(false);
     return <View>...</View>;
   };
   ```

3. **Use PascalCase for Components and Screens**
   - Components: `DungeonCard.js`, `StatBar.js`, `ExerciseItem.js`
   - Screens: `HunterProfileScreen.js`, `WorkoutScreen.js`

4. **Use Default Exports**
   ```javascript
   export default ComponentName;
   ```

5. **Add JSDoc Comments to All Reusable Components**
   ```javascript
   /**
    * Brief description of component
    * @param { string } title - What this prop does
    * @param { function } onPress - Callback description
    */
   ```

6. **Use PropTypes for All Components**
   ```javascript
   ComponentName.propTypes = {
     title: PropTypes.string.isRequired,
     onPress: PropTypes.func,
   };
   ComponentName.defaultProps = {
     onPress: () => {},
   };
   ```

7. **Use PlayerContext for App-Wide State**
   ```javascript
   const { settings, workoutHistory, dispatch } = usePlayer();
   ```

8. **Use MMKV for Disk Persistence**
   - Auto-handled by PlayerContext — no manual reads/writes needed
   - PlayerContext persists state to MMKV on every dispatch

9. **Use @react-navigation for Navigation**
   - Bottom Tab Navigator for main tabs
   - Stack Navigator for modal/push screens
   - Navigate via `navigation.navigate('ScreenName', params)`

10. **Respect Animation Settings**
    ```javascript
    const animationsEnabled = settings?.animationsEnabled ?? true;
    entering={animationsEnabled ? FadeInUp.delay(100) : undefined}
    ```

### ❌ DON'Ts

1. **Don't use class components** — This is a hooks-based codebase

2. **Don't use Redux, MobX, or global state** — Use PlayerContext + MMKV

3. **Don't create separate component variants** — Use props
   - ❌ `ActiveQuestCard.js`, `CompletedQuestCard.js`
   - ✅ `<QuestCard quest={quest} />` with `quest.completed` controlling styling

4. **Don't hardcode colors, fonts, sizes** — Use `theme.js`

5. **Don't skip PropTypes** — All reusable components must have PropTypes

6. **Don't use inline styles** — Use `StyleSheet.create()`

7. **Don't directly mutate state** — Use spread/map in reducers

8. **Don't ignore animation toggle** — All animations must check `settings.animationsEnabled`

---

## File Structure

```
src/
├── components/          # Flat — all reusable UI components
├── screens/             # Full-page screen components
├── store/               # PlayerContext + MMKV storage
├── navigation/          # React Navigation setup
├── data/                # Static data definitions
├── utils/               # Utility modules
└── theme.js             # Design tokens
```

---

## Component Template

```javascript
// React & React Native
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Third-party
import PropTypes from 'prop-types';

// App config & utilities
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';
import { usePlayer } from '../store/PlayerContext';

/**
 * Brief description of component functionality
 * @param { string } title - Description of title prop
 * @param { bool } disabled - What this controls
 * @param { function } onPress - Callback when something happens
 */
const ComponentName = ({ title, disabled = false, onPress }) => {
  const { settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    padding: SPACING.base,
    borderRadius: BORDER_RADIUS.md,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.base,
    color: COLORS.textPrimary,
  },
});

export default ComponentName;
```

---

## Screen Template

```javascript
// React & React Native
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

// Third-party
import { MaterialCommunityIcons } from '@expo/vector-icons';

// App config & utilities
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme';
import { usePlayer } from '../store/PlayerContext';

// Components
import SystemPanel from '../components/SystemPanel';

/**
 * Brief description of screen purpose
 */
export default function ScreenName() {
  const { settings } = usePlayer();
  const animationsEnabled = settings?.animationsEnabled ?? true;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SystemPanel glowColor={COLORS.accent}>
        <Text style={styles.title}>SCREEN TITLE</Text>
      </SystemPanel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: FONT_SIZES.xl,
    color: COLORS.textPrimary,
    letterSpacing: 3,
  },
});
```

---

## Navigation Structure

```
Stack Navigator (root)
├── Main → MainTabs (Bottom Tab Navigator)
│   ├── Profile → HunterProfileScreen
│   ├── Quests → DailyQuestsScreen
│   ├── Dungeons → DungeonsScreen
│   ├── Workout → WorkoutScreen
│   └── History → HistoryScreen
├── Stretching → StretchingScreen
└── WeightHistory → WeightHistoryScreen
```

### Navigating
```javascript
// Push to stack screen
navigation.navigate('Stretching', { dungeonId: 'flex' });
navigation.navigate('WeightHistory');

// Go back
navigation.goBack();
```

---

## State Management Layers

### Layer 1: PlayerContext (App-Wide)
```javascript
// Managed by useReducer in PlayerContext.js
// Accessed via usePlayer() hook
const { level, rank, stats, dailyQuests, settings, dispatch } = usePlayer();
```

### Layer 2: MMKV (Disk Persistent)
```javascript
// Auto-persisted by PlayerContext after each dispatch
// Direct access via storage.js (rarely needed)
import { storage } from '../store/storage';
```

### Layer 3: Component State (Local UI)
```javascript
const [isResting, setIsResting] = useState(false);
const [activeTab, setActiveTab] = useState('weight');
const [toasts, setToasts] = useState([]);
```

---

## Checklist for New Components

- [ ] File placed in `src/components/`
- [ ] Uses PascalCase filename
- [ ] Exported as default export
- [ ] Has JSDoc comment
- [ ] PropTypes defined
- [ ] defaultProps defined
- [ ] All colors from `COLORS`
- [ ] All sizes from `SPACING` / `FONT_SIZES`
- [ ] All fonts from `FONTS`
- [ ] StyleSheet.create() for all styles
- [ ] Animations respect `settings.animationsEnabled`
- [ ] Structured import order with section comments

## Checklist for New Screens

- [ ] File placed in `src/screens/`
- [ ] PascalCase filename with `Screen` suffix
- [ ] Exported as default export
- [ ] Uses `usePlayer()` for global state
- [ ] All design tokens from `theme.js`
- [ ] Handles empty states gracefully
- [ ] Animations respect `settings.animationsEnabled`
- [ ] Structured import order with section comments
