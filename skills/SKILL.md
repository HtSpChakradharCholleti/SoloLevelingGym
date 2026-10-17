---
name: sololveling-gym-dev
description: >
  Development skill for the SoloLevelingGym React Native Expo app.
  Use when adding screens, components, exercises, or modifying state
  in this project.
---

# SoloLevelingGym Development Skill

## Before You Write Code

1. Read `AGENTS.md` — it contains all hard rules.
2. Check `src/theme.js` for the exact token name before using any color, font, or spacing value.
3. Check `src/data/exercises.js` before adding an exercise — IDs must be unique across the whole file.

---

## Adding an Exercise

1. Open `src/data/exercises.js`.
2. Add the entry inside the correct dungeon section comment block.
3. Use a unique `id` in `snake_case`. If the same exercise appears in two dungeons, suffix with the dungeon: `machine_shoulder_press_legs`.
4. `cardio: true` is required for treadmill/incline-walk exercises — omit the field entirely for all others.
5. Do **not** touch the `getExercisesForDungeon`, `getExerciseById`, or `getDungeonById` helpers; they work by filter/find and pick up new entries automatically.

---

## Adding a Component

1. Create the file in `src/components/` — flat, no subdirectories.
2. Structure:
   ```js
   // JSDoc
   // hooks (context first, then useState/useRef)
   // derived values
   // useEffect blocks
   // handlers
   // return JSX
   // PropTypes + defaultProps
   // StyleSheet.create()
   // export default
   ```
3. Import design tokens: `import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../theme';`
4. Gate any animation on `settings?.animationsEnabled ?? true`.

---

## Adding a Screen

1. Create `src/screens/MyNameScreen.js`.
2. Consume state: `const { ... } = usePlayer();`
3. Register route in `app/` (Expo Router) or in `src/navigation/AppNavigator.js` if using React Navigation directly.

---

## Modifying Global State

1. Add the new field to `initialState` in `PlayerContext.js`.
2. Add a migration block in `migrateState()` — bump `CURRENT_SCHEMA_VERSION`.
3. Add an `ActionTypes` entry and a reducer case.
4. Expose a `useCallback` action if screens need to call it.
5. Never break the `prepareSavePayload()` exclusion list (transient UI fields like `showLevelUp` must stay excluded from MMKV).

---

## Key Gotchas

- `WorkoutScreen.js` **must** keep `'use no memo'` at the top of the main component function body.
- Workout history is capped at 100 entries (sliced in `FINISH_WORKOUT`).
- Timers: always store an absolute `endTime = Date.now() + duration` and derive remaining from it in the interval — do not count ticks.
- `stats.STR` etc. are **cumulative raw XP totals**, not levels. Use `getStatLevel(xp)` from `src/utils/leveling.js` to display a level number.
- Measurements history uses a **merge** (not overwrite) on same-date entries. Existing fields survive a partial update.
