# SoloLevelingGym: Code Logic & Variable Patterns

## Variable Naming Conventions

### State Variables (useState)
```javascript
// Boolean flags use semantic prefixes
const [isLoading, setIsLoading] = useState(true);
const [isResting, setIsResting] = useState(false);
const [showModal, setShowModal] = useState(false);
const [hasWorkout, setHasWorkout] = useState(false);

// Current/selected values
const [activeTab, setActiveTab] = useState('weight');
const [selectedDungeon, setSelectedDungeon] = useState(null);

// Collections (plural)
const [toasts, setToasts] = useState([]);
const [completedSets, setCompletedSets] = useState([]);

// Numeric values
const [restDuration, setRestDuration] = useState(180);
const [currentSetIndex, setCurrentSetIndex] = useState(0);
```

### Context State (PlayerContext useReducer)
```javascript
// State shape — all managed via useReducer in PlayerContext
state = {
  level: 1,
  totalXP: 0,
  rank: 'E',
  stats: { STR: { level, xp }, VIT: { level, xp }, ... },
  dailyQuests: [...],
  workoutHistory: [...],
  weightHistory: [...],
  measurementsHistory: [...],
  settings: {
    animationsEnabled: true,
    soundEnabled: true,
    hapticEnabled: true,
  },
  activeWorkout: null,
  totalWorkouts: 0,
  currentStreak: 0,
  bestStreak: 0,
};
```

### Ref Variables
```javascript
// Timer refs (wall-clock based for background accuracy)
const restEndTimeRef = useRef(null);
const intervalRef = useRef(null);

// Animation refs
const glowOpacity = useSharedValue(0.3);
const scale = useSharedValue(1);
const animatedWidth = useRef(new Animated.Value(0)).current;
```

### Derived/Computed Variables
```javascript
// Naming: descriptive camelCase
const rankColor = RANK_COLORS[dungeon.rank] || COLORS.textSecondary;
const statColor = STAT_COLORS[exercise.stat] || COLORS.primary;
const completedCount = completedSets.filter(Boolean).length;
const isAllDone = completedCount >= totalSets;
const progress = totalCount > 0 ? completedCount / totalCount : 0;
const shouldAnimate = animate && (settings?.animationsEnabled ?? true);
```

### Boolean Flag Naming
```javascript
// Good patterns:
is*     — isLoading, isResting, isAllDone, isToday
has*    — hasWorkout, hasHistory
show*   — showModal, showRestTimer
should* — shouldAnimate, shouldAutoStart
can*    — canSkip, canComplete

// Bad patterns to avoid:
✗ flag, value, temp, data (too generic)
✗ status (too vague — use isActive, isComplete, etc.)
```

### Array & Loop Variables
```javascript
// Plural for arrays
const exercises = getExercisesForDungeon(dungeon.id);
const weights = weightHistory.map(h => h.weight);
const dailyData = [];

// Singular for loop items
exercises.map((exercise, index) => { ... });
workoutHistory.forEach((entry) => { ... });
dailyQuests.filter((quest) => !quest.isBonus);
```

---

## Conditional Logic Patterns

### Pattern 1: Guard Clauses (Early Return)
```javascript
// Exit early if conditions fail — reduces nesting
if (workoutHistory.length === 0) return null;
if (!data) return;
if (!animationsEnabled) return;
```

### Pattern 2: Ternary for Simple Conditionals
```javascript
const entering = animationsEnabled ? FadeInUp.delay(100) : undefined;
const barFill = day.isToday ? 'url(#barGradToday)' : 'url(#barGrad)';
const label = dateStr === today ? 'Today' : formatDate(dateStr);
```

### Pattern 3: Nullish Coalescing & Optional Chaining
```javascript
const animationsEnabled = settings?.animationsEnabled ?? true;
const barColor = color || STAT_COLORS[label] || COLORS.primary;
const xp = map[dateStr] || 0;
```

### Pattern 4: Conditional Rendering in JSX
```javascript
{/* Show component only when condition is true */}
{allCompleted && <SystemPanel glowColor={COLORS.success}>...</SystemPanel>}

{/* Conditional prop */}
entering={animationsEnabled ? FadeInUp.delay(index * 100).duration(600) : undefined}
layout={animationsEnabled ? Layout.duration(400) : undefined}

{/* Ternary for either/or rendering */}
{workoutHistory.length === 0 ? (
  <EmptyState />
) : (
  <HistoryList />
)}
```

---

## State Management Patterns

### Pattern 1: Dispatch Actions (PlayerContext)
```javascript
const { dispatch, settings, workoutHistory } = usePlayer();

// Dispatch an action
dispatch({ type: 'COMPLETE_QUEST', payload: { questId, xpReward, stat } });
dispatch({ type: 'FINISH_WORKOUT', payload: { exercises, duration } });
dispatch({ type: 'UPDATE_SETTINGS', payload: { animationsEnabled: false } });
```

### Pattern 2: Immutable State Updates (in Reducer)
```javascript
// Spread to create new object
return { ...state, level: state.level + 1 };

// Map for array updates
const updatedQuests = state.dailyQuests.map(q =>
  q.id === action.payload.questId
    ? { ...q, completed: true }
    : q
);
return { ...state, dailyQuests: updatedQuests };

// Filter for removal
const remaining = state.items.filter(item => item.id !== targetId);
```

### Pattern 3: Reading Context State
```javascript
// Destructure only what you need
const { settings } = usePlayer();
const { workoutHistory, totalWorkouts, currentStreak } = usePlayer();
const { dailyQuests, completeQuest } = usePlayer();
```

### Pattern 4: useMemo for Derived Data
```javascript
const { dailyData, maxXP, totalXP } = useMemo(() => {
  const map = {};
  workoutHistory.forEach(w => {
    map[w.date] = (map[w.date] || 0) + (w.xpEarned || 0);
  });
  // ... compute and return
  return { dailyData, maxXP, totalXP };
}, [workoutHistory]);
```

---

## Error Handling Patterns

### Console Logging
```javascript
// Include function/module name for context
console.log('ERROR: SoundManager.playSound\n', error);
console.log('ERROR: NotificationManager.schedule\n', error);
```

### Try/Catch
```javascript
try {
  await SoundManager.playSound('level_up');
} catch (error) {
  console.log('ERROR: playLevelUpSound\n', error);
}
```

---

## Code Structure Within Files

### Import Order
```javascript
// 1. React & React Native
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Third-party libraries
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import PropTypes from 'prop-types';

// 3. App config & utilities
import { COLORS, FONTS, FONT_SIZES, SPACING } from '../theme';
import { usePlayer } from '../store/PlayerContext';

// 4. Components
import SystemPanel from '../components/SystemPanel';
```

### Functional Component Structure
```javascript
/**
 * JSDoc description
 * @param { type } prop - Description
 */
const ComponentName = ({ prop1, prop2 = defaultValue }) => {
  // 1. Context hooks
  const { settings } = usePlayer();

  // 2. State hooks
  const [isLoading, setIsLoading] = useState(false);

  // 3. Derived values
  const animationsEnabled = settings?.animationsEnabled ?? true;

  // 4. Effects
  useEffect(() => { ... }, []);

  // 5. Handlers
  const handlePress = () => { ... };

  // 6. Render
  return <View>...</View>;
};

// PropTypes & defaultProps
ComponentName.propTypes = { ... };
ComponentName.defaultProps = { ... };

// Styles
const styles = StyleSheet.create({ ... });

export default ComponentName;
```
