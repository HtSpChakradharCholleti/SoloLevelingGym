# SoloLevelingGym: Code Style & Idioms

## Variable Naming Quick Reference

### DO's
```javascript
// ✅ Boolean flags with semantic prefixes
isLoading, isResting, isAllDone, isToday
hasWorkout, hasHistory
showModal, showRestTimer
shouldAnimate, shouldAutoStart
canSkip, canComplete

// ✅ Index/count variables
currentSetIndex, completedCount, totalSets
activeTab, selectedDungeon

// ✅ Derived/computed variables
rankColor, statColor, barColor
completedCount, progress, avgXP

// ✅ Timer/ref variables
restEndTimeRef, intervalRef, glowOpacity, animatedWidth

// ✅ Descriptive style names (in StyleSheet.create)
container, headerRow, itemFooter, exerciseTag
```

### DON'Ts
```javascript
// ❌ Single letter except in loops
x, y, n, temp

// ❌ Acronyms
cfg, attr, mgr, ctrl

// ❌ Numbered variables
data1, data2, value1

// ❌ Non-semantic names
stateData, theValue, result, output
```

---

## Conditional Logic: Detailed Patterns

### Pattern 1: Guard Clause (Early Return)
**When to use:** Exit function early if conditions fail
```javascript
// GOOD: Exit early
if (!animationsEnabled) return;
if (workoutHistory.length === 0) return null;

// BAD: Deep nesting
if (animationsEnabled) {
  // ... lots of code
}
```

### Pattern 2: Ternary for UI Conditionals
**When to use:** Simple true/false render decisions
```javascript
// GOOD: Conditional animation
entering={animationsEnabled ? FadeInUp.delay(100) : undefined}

// GOOD: Conditional text
const label = dateStr === today ? 'Today' : formatDate(dateStr);

// BAD: Ternary with too much logic
{ condition ? <ComplexComponent1 /> : <ComplexComponent2 /> }
```

### Pattern 3: Nullish Coalescing & Optional Chaining
**When to use:** Safe property access and fallbacks
```javascript
// GOOD: Safe access with fallback
const animationsEnabled = settings?.animationsEnabled ?? true;
const barColor = color || STAT_COLORS[label] || COLORS.primary;
const xp = map[dateStr] || 0;
```

### Pattern 4: Conditional JSX Rendering
**When to use:** Show/hide components based on state
```javascript
// GOOD: Short-circuit for optional rendering
{allCompleted && <CompletionBanner />}

// GOOD: Ternary for either/or
{isEmpty ? <EmptyState /> : <DataList />}

// GOOD: Map with filter
{dailyQuests.filter(q => !q.isBonus).map((quest, index) => (
  <QuestCard key={quest.id} quest={quest} index={index} />
))}
```

---

## State Management: Deep Patterns

### Pattern 1: Context Hook Destructuring
```javascript
// Destructure only what you need
const { settings } = usePlayer();
const { workoutHistory, totalWorkouts, currentStreak, bestStreak } = usePlayer();
const { dailyQuests, completeQuest } = usePlayer();
```

### Pattern 2: Dispatch Actions
```javascript
// Simple action
dispatch({ type: 'COMPLETE_QUEST', payload: { questId, xpReward, stat } });

// Complex action with multiple fields
dispatch({
  type: 'FINISH_WORKOUT',
  payload: { exercises, duration, dungeonId },
});

// Settings update
dispatch({
  type: 'UPDATE_SETTINGS',
  payload: { animationsEnabled: false },
});
```

### Pattern 3: Immutable Reducer Updates
```javascript
// ✅ GOOD: Spread for new object
return { ...state, level: state.level + 1, totalXP: state.totalXP + xp };

// ✅ GOOD: Map for array item update
const updatedQuests = state.dailyQuests.map(q =>
  q.id === questId ? { ...q, completed: true } : q
);
return { ...state, dailyQuests: updatedQuests };

// ✅ GOOD: Spread for prepending to array
return { ...state, workoutHistory: [newEntry, ...state.workoutHistory] };

// ❌ BAD: Direct mutation
state.dailyQuests[0].completed = true;
state.workoutHistory.push(newEntry);
```

### Pattern 4: useMemo for Expensive Computations
```javascript
const { dailyData, maxXP, totalXP } = useMemo(() => {
  const map = {};
  workoutHistory.forEach(w => {
    map[w.date] = (map[w.date] || 0) + (w.xpEarned || 0);
  });
  // ... build and return
  return { dailyData, maxXP, totalXP };
}, [workoutHistory]);
```

---

## Animation Patterns

### Pattern 1: Reanimated Entry Animations (Conditional)
```javascript
const { settings } = usePlayer();
const animationsEnabled = settings?.animationsEnabled ?? true;

<Animated.View
  entering={animationsEnabled ? FadeInUp.delay(index * 100).duration(600) : undefined}
  layout={animationsEnabled ? Layout.duration(400) : undefined}
>
```

### Pattern 2: Reanimated Looping Effects (Conditional)
```javascript
useEffect(() => {
  if (!animationsEnabled) return;
  glowOpacity.value = withRepeat(
    withTiming(0.7, { duration: 2000 }),
    -1,
    true
  );
}, [animationsEnabled]);
```

### Pattern 3: RN Animated with Toggle
```javascript
const overlayOpacity = useRef(new Animated.Value(animationsEnabled ? 0 : 1)).current;

useEffect(() => {
  if (!animationsEnabled) return;
  Animated.timing(overlayOpacity, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }).start();
}, []);
```

### Pattern 4: Wall-Clock Timers (Background Safe)
```javascript
// Use Date.now() for timers that survive app backgrounding
const restEndTimeRef = useRef(null);

const startTimer = () => {
  restEndTimeRef.current = Date.now() + duration * 1000;
  intervalRef.current = setInterval(() => {
    const remaining = Math.max(0, restEndTimeRef.current - Date.now());
    setTimeLeft(Math.ceil(remaining / 1000));
    if (remaining <= 0) clearInterval(intervalRef.current);
  }, 200);
};
```

---

## Component Styling Patterns

### Pattern 1: StyleSheet.create (Always)
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
});
```

### Pattern 2: Conditional Style Arrays
```javascript
<View style={[styles.container, SHADOWS.soft, isAllDone && styles.containerDone]} />
<Text style={[styles.statXPTag, { color: STAT_COLORS[stat] }]} />
```

### Pattern 3: Dynamic Styles via Computed Values
```javascript
const rankColor = RANK_COLORS[dungeon.rank] || COLORS.textSecondary;
<View style={[styles.rankBadge, { borderColor: rankColor }]} />
```

---

## Defensive Programming Patterns

### Null/Undefined Safety
```javascript
// Optional chaining
const animationsEnabled = settings?.animationsEnabled ?? true;
const xp = entry?.xpEarned || 0;

// Array safety
const completedCount = (completedSets || []).filter(Boolean).length;

// Fallback values
const barColor = color || STAT_COLORS[label] || COLORS.primary;
```

### Guard Clauses
```javascript
if (!data) return null;
if (workoutHistory.length === 0) return null;
if (workoutHistory.length < 2) return null;
```

---

## Summary: Code Quality Principles

1. **Semantic Naming:** Variables clearly indicate purpose and type
2. **Early Returns:** Guard clauses prevent deep nesting
3. **Immutability:** Use spread/map, never direct mutation
4. **Animation Toggle:** All animations gated by `settings.animationsEnabled`
5. **Explicit Conditionals:** Ternary for simple, guard clause for complex
6. **Config Centralization:** All visual tokens from `theme.js`
7. **Console Logging:** Include function/module name with error
8. **Component Structure:** JSDoc → hooks → derived → effects → handlers → render
9. **PropTypes:** Required on all reusable components
10. **useMemo:** For expensive derived data from context
