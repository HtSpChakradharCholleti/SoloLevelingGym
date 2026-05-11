# SoloLevelingGym: Utility Functions & Common Patterns

## SoundManager.js Reference

**Purpose:** Centralized audio playback with haptic feedback integration

```javascript
import { SoundManager } from '../utils/SoundManager';

// Play a sound effect
await SoundManager.playSound('level_up');
await SoundManager.playSound('timer_complete');
await SoundManager.playSound('set_complete');

// Sound + haptic feedback (respects settings)
SoundManager.playWithHaptic('set_complete', settings);
```

**Pattern: Always wrap in try/catch**
```javascript
try {
  await SoundManager.playSound('level_up');
} catch (error) {
  console.log('ERROR: SoundManager.playSound\n', error);
}
```

---

## NotificationManager.js Reference

**Purpose:** Schedule daily reminders and workout notifications

```javascript
import { NotificationManager } from '../utils/NotificationManager';

// Schedule all recurring reminders
await NotificationManager.scheduleAllReminders();

// Schedule a single notification
await NotificationManager.scheduleDailyNotification({
  title: 'Walking Protocol 🚶‍♂️',
  body: 'Time for your daily walk, Hunter.',
  hour: 18,
  minute: 30,
  identifier: 'daily-walking',
});
```

**Pattern: Fire-and-forget for non-critical operations**
```javascript
// Scheduling notifications is non-critical — don't block UI
NotificationManager.scheduleAllReminders().catch(error => {
  console.log('ERROR: scheduleAllReminders\n', error);
});
```

---

## leveling.js Reference

**Purpose:** XP calculation, level-up detection, and rank progression

```javascript
import { calculateXPForLevel, getRankForLevel, RANK_TITLES } from '../utils/leveling';

// Get XP needed for a specific level
const xpNeeded = calculateXPForLevel(5); // returns 250

// Get rank for a level
const rank = getRankForLevel(10); // returns 'C'

// Rank display name
const title = RANK_TITLES['C']; // returns 'C-Rank Hunter'
```

---

## quests.js Reference

**Purpose:** Generate daily quest objects from exercise data

```javascript
import { generateDailyQuests } from '../utils/quests';

// Generate new quests for today
const quests = generateDailyQuests(exercises, playerLevel);
// Returns: [{ id, text, stat, xpReward, completed, isBonus }, ...]
```

---

## suggestions.js Reference

**Purpose:** Generate workout suggestions based on player history

```javascript
import { getSuggestion } from '../utils/suggestions';

// Get today's suggested workout
const suggestion = getSuggestion(workoutHistory, stats);
// Returns: { dungeonId, reason }
```

---

## theme.js Design Token Reference

**Purpose:** Single source of truth for all visual design tokens

```javascript
import {
  COLORS, RANK_COLORS, STAT_COLORS,
  FONTS, FONT_SIZES, SPACING,
  BORDER_RADIUS, SHADOWS, GRADIENTS,
} from '../theme';

// Colors
COLORS.background       // '#040405' - Ultra-dark background
COLORS.surface          // '#121215' - Card/panel surface
COLORS.surfaceBorder    // '#222226' - Subtle borders
COLORS.primary          // '#e8e8f0' - Crisp white/silver
COLORS.accent           // '#cba153' - Gold accent
COLORS.textPrimary      // '#f4f4f5'
COLORS.textSecondary    // '#a1a1aa'
COLORS.textMuted        // '#52525b'
COLORS.success          // '#10b981'
COLORS.danger           // '#ef4444'
COLORS.warning          // '#fadd60'

// Fonts (all Outfit family)
FONTS.heading           // 'Outfit_700Bold'
FONTS.body              // 'Outfit_400Regular'
FONTS.bodyMedium        // 'Outfit_500Medium'
FONTS.bodySemiBold      // 'Outfit_600SemiBold'

// Font Sizes
FONT_SIZES.xs           // 10
FONT_SIZES.sm           // 12
FONT_SIZES.md           // 14
FONT_SIZES.base         // 16
FONT_SIZES.lg           // 18
FONT_SIZES.xl           // 22
FONT_SIZES.xxl          // 28

// Spacing
SPACING.xs              // 4
SPACING.sm              // 8
SPACING.md              // 12
SPACING.base            // 16
SPACING.lg              // 20
SPACING.xl              // 24
SPACING.xxl             // 32

// Border Radius
BORDER_RADIUS.sm        // 6
BORDER_RADIUS.md        // 10
BORDER_RADIUS.lg        // 14
BORDER_RADIUS.round     // 100

// Shadows
SHADOWS.soft            // Pre-configured dark shadow object
SHADOWS.glow(color, intensity)  // Dynamic glow shadow function

// Rank Colors
RANK_COLORS.E           // Zinc-700 (dark)
RANK_COLORS.S           // Primary Silver (brightest)

// Stat Colors
STAT_COLORS.STR         // Metallic silver-blue
```

---

## MMKV Storage Reference

**Purpose:** Fast synchronous key-value storage for state persistence

```javascript
import { storage } from '../store/storage';

// The MMKV instance is used internally by PlayerContext
// Direct usage is rarely needed — prefer dispatch actions

// Read
const value = storage.getString('player-state');
const parsed = JSON.parse(value);

// Write
storage.set('player-state', JSON.stringify(state));
```

**Pattern: PlayerContext auto-persists**
```javascript
// In PlayerContext reducer, state is auto-saved to MMKV after each dispatch
// You should NOT manually write to MMKV for player state
// Instead, dispatch an action:
dispatch({ type: 'UPDATE_SETTINGS', payload: { soundEnabled: false } });
```

---

## Best Practices for Utility Functions

1. **Always handle errors:** Wrap in try/catch, log with function name
2. **Provide defaults:** Use default parameters
3. **Return meaningful values:** true/false for checks, data for fetches
4. **Document parameters:** Always include JSDoc comments
5. **Keep pure:** Avoid side effects where possible
6. **Reuse:** If doing it twice, extract to a utility
7. **Provide fallbacks:** Never let null/undefined break user flow
8. **Log errors consistently:** `console.log('ERROR: functionName\n', error)`
