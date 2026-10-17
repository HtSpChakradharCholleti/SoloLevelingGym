# SoloLevelingGym — Agent Ruleset

> Only confident rules derived from actual project code. Keep brief.

---

## Stack

- React Native 0.83.4 + Expo ~55 — **JavaScript only** (no TypeScript in `src/`)
- State: `useReducer` + `useContext` via `PlayerContext` — no Redux, no Zustand
- Persistence: `react-native-mmkv` (synchronous, single key `@solo_leveling_gym`)
- Animations: `react-native-reanimated` 4.x — UI thread via shared values
- Icons: `MaterialCommunityIcons` exclusively
- Fonts: Outfit 400/500/600/700 (`FONTS.body`, `FONTS.bodyMedium`, `FONTS.bodySemiBold`, `FONTS.heading`)

---

## File Locations

| What | Where |
|---|---|
| Screens | `src/screens/` — PascalCase + `Screen` suffix |
| Components | `src/components/` — flat, no subdirectories |
| Global state | `src/store/PlayerContext.js` |
| Design tokens | `src/theme.js` |
| Exercise data | `src/data/exercises.js` |
| Utilities | `src/utils/` |

---

## Hard Rules

1. **All colors, fonts, spacing, and radii from `src/theme.js`.** Never hardcode hex values or px numbers.
2. **All styles via `StyleSheet.create()`.** No inline style objects in production code.
3. **All app-wide state via `usePlayer()`.** Never manage shared data in local component state.
4. **Reducer updates are immutable.** Use spread/map/filter — never mutate `state` directly.
5. **All animations gated by `settings.animationsEnabled`.** Check before starting any animation.
6. **Timers use wall-clock (`Date.now()`), not tick-counting.** Ensures accuracy after app backgrounding.
7. **`WorkoutScreen.js` carries `'use no memo'` at the top of the main component.** Do not remove it — the React Compiler beta crashes without it when `activeWorkout` is null.
8. **Workout duration is capped at 3 hours** in the `FINISH_WORKOUT` reducer. The same cap applies when computing ETA averages from `workoutHistory`.
9. **Adding an exercise to `exercises.js` requires a unique snake_case `id`.** Exercises sharing a name across dungeons need distinct IDs (e.g. `machine_shoulder_press` vs `machine_shoulder_press_legs`).
10. **Schema migrations live in `migrateState()` in `PlayerContext.js`.** Bump `CURRENT_SCHEMA_VERSION` for every breaking state-shape change.

---

## Patterns

```js
// Read from context — destructure only what you need
const { workoutHistory, settings } = usePlayer();

// Safe access with fallback
const animationsEnabled = settings?.animationsEnabled ?? true;

// Conditional animation (always gate by setting)
entering={animationsEnabled ? FadeInUp.duration(400) : undefined}

// Guard clause (prefer over deep nesting)
if (!activeWorkout) return null;

// Immutable reducer update
return { ...state, totalWorkouts: state.totalWorkouts + 1 };
```

---

## Key Context API

**Reads**: `playerName`, `level`, `xp`, `rank`, `stats`, `activeWorkout`, `workoutHistory`, `weightHistory`, `measurementsHistory`, `dailyQuests`, `settings`, `currentStreak`, `totalWorkouts`

**Writes**: `startWorkout(exercises)`, `finishWorkout()`, `cancelWorkout()`, `completeExerciseSet(id, index, xp, stat)`, `addExerciseToWorkout(exercise)`, `removeExerciseFromWorkout(id)`, `setExerciseWeight(id, weight)`, `gainXP(amount)`, `updateSetting(key, value)`, `logWeight(weight, unit, date)`, `logMeasurement(fields, unit, date)`

---

## Exercise Data Shape

```js
{
  id: 'snake_case_unique',
  name: 'Display Name',
  dungeonId: 'push' | 'pull' | 'legs' | 'recovery' | 'cardio' | 'warmup_stretching',
  stat: 'STR' | 'VIT' | 'AGI' | 'END' | 'INT' | 'PER',
  baseXP: number,        // XP per completed set
  defaultSets: number,
  defaultReps: number,
  repRange: string,      // e.g. '8–12' or '30–45 sec'
  icon: string,          // MaterialCommunityIcons name
  muscle: string,        // e.g. 'Chest (Upper)'
  cardio: true,          // only on cardio/treadmill exercises
}
```
