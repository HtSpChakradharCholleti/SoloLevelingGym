# SoloLevelingGym — AI Context Reference

> **Purpose**: This file exists so any AI assistant (GitHub Copilot, Claude, Gemini, etc.) can
> immediately understand the full app without reading every source file. Keep it in sync with
> major architectural changes.

---

## 1. App Overview

**SoloLevelingGym** is a React Native (Expo) workout companion app themed around the *Solo Leveling*
manhwa/anime. The core gamification loop: the user completes real gym workouts → earns XP and stat
points → levels up their "Hunter" character.

- **Platform**: Android-first (also compiles for iOS). Orientation: portrait only.
- **Bundle ID**: `com.chakradharxd.SoloLevelingGym`
- **App version**: `1.1.0` (native binary, bumped when native deps change)
- **OTA updates**: Delivered via `@hot-updater/react-native` against AWS S3. Channel = `production`.
  Local deployment uses `actwithcache publish-ota-update.yaml` (act workflow runner).

---

## 2. Tech Stack

| Layer | Library / Version |
|---|---|
| Framework | React Native `0.83.4` + Expo `~55.0.8` |
| Language | JavaScript (JS, no TypeScript in src/) |
| State | React `useReducer` + Context API (no Redux, no Zustand) |
| Persistence | `react-native-mmkv` (synchronous key-value, much faster than AsyncStorage) |
| Navigation | React Navigation v7 — bottom tabs + stack |
| Animations | `react-native-reanimated` 4.x + `react-native-worklets` 0.7.2 |
| Audio | `expo-audio` (`createAudioPlayer`) |
| Notifications | `expo-notifications` |
| Fonts | `@expo-google-fonts/outfit` — Outfit 400/500/600/700 |
| Icons | `@expo/vector-icons` → `MaterialCommunityIcons` exclusively |
| SVG | `react-native-svg` 15.x — charts, progress rings |
| Gradients | `expo-linear-gradient` |
| OTA | `@hot-updater/react-native` 0.30.1 |
| Compiler | React Compiler beta (`babel-plugin-react-compiler`) — **partially opted out** (see §9) |

---

## 3. Project Structure

```
SoloLevelingGym/
├── App.js                       # Entry point — font loading, SoundManager.init(), notifications
├── index.js                     # Expo's registerRootComponent wrapper
├── app.json                     # Expo config (permissions, plugins, bundle IDs)
├── hot-updater.config.ts        # OTA build config (custom JSON-output database plugin)
├── publish-ota-update.yaml      # act (local GitHub Actions runner) workflow for OTA deploy
├── ota-update-config.json       # Tracks appVersion + channel used in OTA uploads
├── src/
│   ├── theme.js                 # Design tokens (COLORS, FONTS, SPACING, etc.)
│   ├── navigation/
│   │   └── AppNavigator.js      # Bottom tab nav + stack screens
│   ├── store/
│   │   ├── PlayerContext.js     # Global state (useReducer + Context)
│   │   └── storage.js           # MMKV singleton instance
│   ├── data/
│   │   ├── exercises.js         # DUNGEONS[], EXERCISES[], PPL_ROTATION, helper fns
│   │   └── stretches.js         # Stretch routines for the stretch timer screen
│   ├── screens/
│   │   ├── HunterProfileScreen.js   # Player stats, XP bar, weight/measurement panels, settings
│   │   ├── DailyQuestsScreen.js     # Daily quest list + bonus quest
│   │   ├── DungeonsScreen.js        # Dungeon grid + exercise selection modal
│   │   ├── WorkoutScreen.js         # Active workout tracker
│   │   ├── StretchingScreen.js      # Guided stretch timer
│   │   ├── HistoryScreen.js         # Past workout history ("Shadow Army")
│   │   └── WeightHistoryScreen.js   # Body weight + measurements log history (tabbed)
│   ├── components/
│   │   ├── DungeonCard.js           # Grid card for each dungeon
│   │   ├── ExerciseItem.js          # Individual exercise row (sets buttons)
│   │   ├── LevelUpOverlay.js        # Full-screen level-up celebration modal
│   │   ├── QuestCard.js             # Daily quest card
│   │   ├── RankBadge.js             # Rank letter badge (E→S)
│   │   ├── StatBar.js               # Horizontal stat progress bar
│   │   ├── SystemPanel.js           # Glowing dark panel container
│   │   ├── WeightChart.js           # SVG line chart for weight trend (used in WeightHistoryScreen)
│   │   ├── WeightLogModal.js        # Tabbed body stats modal (Weight tab + Measurements tab)
│   │   └── XPToast.js               # Floating XP toast notification
│   └── utils/
│       ├── leveling.js              # XP formula, rank thresholds, stat levels
│       ├── quests.js                # Daily quest generation (seeded by date)
│       ├── suggestions.js           # PPL rotation workout suggestion engine
│       ├── SoundManager.js          # Audio playback singleton (expo-audio)
│       ├── NotificationManager.js   # Push notification scheduling
│       ├── withHotUpdater.js        # HOC that wraps App with OTA update checking
│       └── AbortController.ts       # Polyfill for AbortController
├── assets/
│   ├── sounds/                      # WAV audio files (bgm, tap, level_up, etc.)
│   └── *.png                        # App icons, splash screen
└── patches/
    └── hot-updater+0.29.6.patch     # Patch for hot-updater package bug
```

---

## 4. Navigation Structure

```
AppNavigator (Stack, headers hidden)
└── Main (Bottom Tabs)
    ├── Profile    → HunterProfileScreen    (tab icon: shield-crown)
    ├── Quests     → DailyQuestsScreen      (tab icon: clipboard-list)
    ├── Dungeons   → DungeonsScreen         (tab icon: gate)
    ├── Workout    → WorkoutScreen           (tab icon: sword-cross)
    └── History    → HistoryScreen           (tab icon: ghost)

Stack screens (push over tabs, header visible):
├── Stretching     → StretchingScreen
└── WeightHistory  → WeightHistoryScreen
```

---

## 5. Global State — `PlayerContext`

**File**: `src/store/PlayerContext.js`  
**Storage**: All state is persisted via MMKV under the key `@solo_leveling_gym`.

### 5.1 State Shape

```js
{
  // Player identity
  playerName: 'Hunter',          // string
  level: 1,                      // number (1+)
  xp: 0,                         // number — current XP within the level
  rank: 'E',                     // 'E' | 'D' | 'C' | 'B' | 'A' | 'S'

  // Six stats — raw XP totals (not capped, grow forever)
  stats: { STR: 0, VIT: 0, AGI: 0, END: 0, INT: 0, PER: 0 },

  // Streaks & history
  totalWorkouts: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,          // 'YYYY-MM-DD' string or null

  // Daily quests
  dailyQuests: [],                // array of quest objects (see §7)
  lastQuestDate: null,            // 'YYYY-MM-DD' or null

  // Active workout (null when no workout running)
  activeWorkout: null,            // see §5.2

  // History (last 100 workouts)
  workoutHistory: [],             // array of historyEntry objects (see §5.3)

  // Weight log (descending order, unlimited)
  weightHistory: [],              // [{ date: 'YYYY-MM-DD', weight: number, unit: 'kg' }]

  // Body measurements log (descending order, unlimited)
  // Fields are optional — a single entry may log only some metrics
  measurementsHistory: [],        // [{ date: 'YYYY-MM-DD', bicep?: number, chest?: number, belly?: number, unit: 'cm' }]

  // UI
  showLevelUp: false,
  levelUpData: null,
  xpToasts: [],

  // Settings
  settings: {
    animationsEnabled: true,
    bgmEnabled: true,
  },

  isLoaded: false,                // set true after MMKV load completes
}
```

### 5.2 Active Workout Shape

```js
activeWorkout: {
  exercises: [
    {
      id: 'machine_chest_press',  // matches EXERCISES[].id
      name: 'Machine Chest Press',
      stat: 'STR',
      baseXP: 22,
      sets: 3,                    // number of set buttons shown
      reps: 10,                   // numeric reps (for display fallback)
      repRange: '8–12',           // string range (preferred for display)
      muscle: 'Chest',            // muscle group label (may be undefined on old data)
      icon: 'dumbbell',           // MaterialCommunityIcons name
    },
    // ...
  ],
  startTime: 1713800000000,       // Date.now() at workout start
  completedSets: {
    'machine_chest_press': [true, true, false],  // per-exercise array indexed by set number
    // ...
  },
  xpEarned: 44,                   // running total XP earned this session
  statXPEarned: { STR: 44 },      // per-stat XP breakdown
}
```

### 5.3 History Entry Shape

```js
{
  id: 'workout_1713800000000',
  date: 'YYYY-MM-DD',
  startTime: number,             // epoch ms
  endTime: number,               // epoch ms
  duration: number,              // ms
  exercises: [
    { id, name, completedSets: number, totalSets: number }
  ],
  xpEarned: number,
  statXPEarned: { STR: number, ... },
}
```

### 5.4 Exposed Context API

```js
// Reads
playerName, level, xp, rank, stats,
totalWorkouts, currentStreak, bestStreak, lastWorkoutDate,
dailyQuests, lastQuestDate,
activeWorkout,
workoutHistory,
weightHistory,                    // always array (defaults to [])
measurementsHistory,              // always array (defaults to [])
showLevelUp, levelUpData,
xpToasts,
settings,
isLoaded,

// Writes
gainXP(amount)
gainStatXP(stat, amount)
completeQuest(questId, xpReward, stat)
startWorkout(exercises)           // exercises: raw EXERCISES[] entries
addExerciseToWorkout(exercise)    // add any exercise mid-session; prevents duplicates
removeExerciseFromWorkout(exerciseId)  // remove exercise (reducer keeps completedSets in case)
completeExerciseSet(exerciseId, setIndex, xp, stat)
finishWorkout()                   // applies XP/stats, writes to history, clears activeWorkout
cancelWorkout()                   // clears activeWorkout, no XP awarded
dismissLevelUp()
setPlayerName(name)
logWeight(weight, unit?, date?)   // unit defaults to 'kg'; date defaults to today (YYYY-MM-DD)
logMeasurement(measurements, unit?, date?)
                                  // measurements: { bicep?, chest?, belly? } (all optional)
                                  // unit defaults to 'cm'; merges into existing entry for same date
updateSetting(key, value)
resetAll()                        // wipes MMKV + resets state to initial
```

---

## 6. Workout System — PPL Split

### 6.1 Dungeon Definitions (`src/data/exercises.js`)

Six dungeons, each with a **Solo Leveling-themed name**:

| ID | Name | Split Label | Stat | Exercises |
|---|---|---|---|---|
| `push` | Crimson Fortress | PUSH | STR | 6 (incl. Treadmill) |
| `pull` | Shadow Spire | PULL | PER | 6 (incl. Treadmill) |
| `legs` | Titan's Path | LEGS | END | 7 (incl. Plank + Treadmill) |
| `recovery` | Iron Sanctum | REST | VIT | 4 |
| `cardio` | Wind Temple | CARDIO | AGI | 4 |
| `warmup_stretching` | Arcane Grove | FLEX | INT | 3 |

`warmup_stretching` is excluded from workout suggestions (it's pre/post workout only).

### 6.2 PPL Rotation

```js
export const PPL_ROTATION = ['push', 'recovery', 'pull', 'recovery', 'legs'];
// Day 1: Push  →  Day 2: Rest/Recovery  →  Day 3: Pull  →  Day 4: Rest  →  Day 5: Legs
```

### 6.3 Exercise Fields

```js
{
  id: string,          // unique snake_case ID
  name: string,        // display name
  dungeonId: string,   // parent dungeon
  stat: string,        // 'STR' | 'VIT' | 'AGI' | 'END' | 'INT' | 'PER'
  baseXP: number,      // XP awarded per set completion
  defaultSets: number, // how many sets shown when dungeon is started
  defaultReps: number, // numeric reps (fallback)
  repRange: string,    // human-readable range, e.g. '8–12' or '30–45 sec'
  icon: string,        // MaterialCommunityIcons name
  muscle: string,      // muscle group label, e.g. 'Chest (Upper)'
}
```

### 6.4 Push Day Exercises

| Exercise | Sets | Rep Range | Muscle |
|---|---|---|---|
| Machine Chest Press | 3 | 8–12 | Chest |
| Incline Press | 3 | 8–12 | Chest (Upper) |
| Machine Shoulder Press | 3 | 8–10 | Shoulders |
| Lateral Raises | 3 | 12–15 | Side Delts |
| Tricep Pushdowns | 3 | 10–12 | Triceps |
| Incline Treadmill Walk | 1 | 10–15 min | Cardiovascular |

### 6.5 Pull Day Exercises

| Exercise | Sets | Rep Range | Muscle |
|---|---|---|---|
| Lat Pulldown | 3 | 8–12 | Lats |
| Seated Cable Row | 3 | 8–12 | Mid-Back |
| Face Pulls | 3 | 12–15 | Rear Delts |
| Dumbbell Bicep Curls | 3 | 10–12 | Biceps |
| Hammer Curls | 3 | 10–12 | Brachialis |
| Incline Treadmill Walk | 1 | 10–15 min | Cardiovascular |

### 6.6 Leg Day Exercises

| Exercise | Sets | Rep Range | Muscle |
|---|---|---|---|
| Leg Press or Squats | 3 | 8–12 | Quads / Glutes |
| Leg Curl | 3 | 10–12 | Hamstrings |
| Leg Extension | 3 | 10–12 | Quads |
| Calf Raises | 3 | 12–15 | Calves |
| Plank | 3 | 30–40 sec | Core |
| Incline Treadmill Walk | 1 | 10–15 min | Cardiovascular |

### 6.7 Recovery Day Exercises

| Exercise | Sets | Rep Range | Muscle |
|---|---|---|---|
| Incline Treadmill Walk | 1 | 10–15 min | Full Body |
| Hanging Knee Raises | 3 | 10–12 | Core |
| Plank | 3 | 30–45 sec | Core |
| Back Extensions | 3 | 12–15 | Lower Back |

---

## 7. Leveling System (`src/utils/leveling.js`)

### XP Formula
```
xpRequired(level) = level × 100 + level² × 10
```

### Rank Thresholds

| Rank | Levels |
|---|---|
| E | 1–10 |
| D | 11–20 |
| C | 21–30 |
| B | 31–40 |
| A | 41–50 |
| S | 51+ |

### Stat Levels
- Stat level = `Math.floor(statXP / 200) + 1`
- Stat XP is cumulative raw total; it never resets
- Each exercise set completion awards `exercise.baseXP` XP to both total XP and the exercise's stat

---

## 8. Daily Quest System (`src/utils/quests.js`)

- **4 quests** are generated per day, seeded by the date string (same quests for everyone on the same day).
- Quests are drawn from 17 templates across all 6 stats.
- A **bonus quest** ("Complete all daily quests") is auto-appended and grants +100 XP to ALL stats.
- Quests reset automatically when `lastQuestDate !== today` (checked on app load via `useEffect`).
- `completeQuest()` dispatches `COMPLETE_QUEST` + calls `gainXP` + `gainStatXP` at 50% of the quest reward.
- If *all non-bonus quests* are completed, the bonus quest is auto-completed too.

---

## 9. Workout Suggestion Engine (`src/utils/suggestions.js`)

Given `workoutHistory` and `stats`, returns the best dungeon to train today:

**Scoring factors (in priority order):**

1. **PPL rotation alignment** (0–40 pts) — checks what the last split was and awards points for the *correct next* split in the PPL cycle.
2. **Rest days since last session** (0–30 pts) — more days of rest = higher score; training the same dungeon today gets -40 pts.
3. **Stat balance** (0–20 pts) — dungeons boosting the user's weakest stat score higher.
4. **Frequency balance** (0–10 pts) — less-trained dungeons get a small boost.

The `warmup_stretching` dungeon is always excluded from suggestions.

---

## 10. Design System (`src/theme.js`)

### Color Palette (Ultra-dark CRED-inspired)

```js
COLORS = {
  background:    '#040405',   // near-black
  surface:       '#121215',
  surfaceLight:  '#18181b',
  surfaceBorder: '#222226',
  primary:       '#e8e8f0',   // crisp silver-white
  primaryDark:   '#8888a0',
  primaryGlow:   'rgba(232,232,240,0.1)',
  accent:        '#cba153',   // CRED-style gold/copper
  accentDark:    '#8e6b2c',
  accentGlow:    'rgba(203,161,83,0.15)',
  textPrimary:   '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted:     '#52525b',
  success:       '#10b981',
  danger:        '#ef4444',
  warning:       '#fadd60',
}
```

All stat colors (`STAT_COLORS.STR/VIT/AGI/END/INT/PER`) are the same silver `#94a3b8`.  
Rank colors use a metallic progression from Zinc-700 (E) to silver-white (S).

### Typography
Font family: **Outfit** (Google Fonts). Variants used:
- `Outfit_400Regular` → `FONTS.body`
- `Outfit_500Medium` → `FONTS.bodyMedium`
- `Outfit_600SemiBold` → `FONTS.bodySemiBold`
- `Outfit_700Bold` → `FONTS.heading`

### Spacing Scale (px)
`xs:4, sm:8, md:12, base:16, lg:20, xl:24, xxl:32, xxxl:40`

### Font Sizes (px)
`xs:10, sm:12, md:14, base:16, lg:18, xl:22, xxl:28, xxxl:36, giant:48`

---

## 11. Audio System (`src/utils/SoundManager.js`)

Singleton instance (`export default new SoundManager()`). Initialized in `App.js` via `SoundManager.init()` after fonts load.

| Method | Sound file | When |
|---|---|---|
| `playTap()` | `tap.wav` | Generic UI interaction |
| `playLevelUp()` | `level_up.wav` | Level-up + weight log |
| `playQuestComplete()` | `quest_complete.wav` | Quest/workout complete |
| `playDungeonEnter()` | `dungeon_enter.wav` | Entering a dungeon |
| `playTimerTick()` | `timer_tick.wav` | Stretch timer tick |
| `playTimerComplete()` | `timer_complete.wav` | Stretch timer done |
| `playTimerCompleteLoop()` | `timer_complete.wav` (looped) | Until dismissed |
| `stopTimerComplete()` | — | Stop the loop |
| `pauseBGM()` / `resumeBGM()` | `bgm.wav` | Settings toggle / app background |

BGM auto-pauses when app goes to background and resumes on `AppState → 'active'`.

---

## 12. Notification System (`src/utils/NotificationManager.js`)

All notifications use the `system_alerts` Android channel (importance MAX).

**Scheduled daily reminders** (set up at app launch via `scheduleAllReminders()`):

| Time | Title | Purpose |
|---|---|---|
| 08:00 | "Time to Level Up! ⚔️" | Workout reminder |
| 10:00 | "System Check: Positive Aura 😄" | Mental health / smile |
| 11:00 | "Hydration Protocol 💧" | Water reminder |
| 13:00 | "Maintenance Break 🍱" | Lunch reminder |
| 15:00 | "Mid-Day Boost ✨" | Smile reminder |
| 18:00 | "Golden Hour Smile 🌅" | Smile reminder |
| 20:00 | "Evening Feast 🍖" | Dinner reminder |
| 22:30 | "System Shutdown 💤" | Sleep reminder |

**Foreground notification handling**: by default, **all notifications are suppressed in foreground** *except* those with `data.isTest === true`. This prevents reminders from appearing as banners while the user is actively using the app.

**Timer notifications**: `scheduleTimerNotification(seconds, label)` fires once when the stretch timer ends. Cancelled via `cancelTimerNotification()`.

---

## 13. OTA Update System

### Architecture
- Runtime wrapper: `withHotUpdater(App)` HOC in `App.js` — checks for new bundles on launch
- Config: `hot-updater.config.ts` uses a **custom JSON-output database plugin** (writes `.hot-updater/output/bundle/android.json`) instead of a remote database
- Storage: `localStorage` dummy plugin (bundles are handled separately by the CI workflow)
- Update strategy: `appVersion` — OTA updates are scoped to native binary version `1.0.0`

### CI Deployment (local act runner)
Workflow: `publish-ota-update.yaml` (run via `actwithcache publish-ota-update.yaml`):
1. Installs dependencies (cached)
2. Builds Android OTA bundle (`EXPO_PUBLIC_CHANNEL=production`)
3. Extracts bundle hash from metadata JSON
4. Uploads bundle `.zip` → `s3://solo-leveling-ota-updates/android/production/1.0.0/bundles/<hash>.zip`
5. Backs up previous `update.json` → `history/update_<timestamp>.json`
6. Uploads new `update.json`

### Environment Variables
- `EXPO_PUBLIC_CHANNEL` — OTA channel name; set to `production` for all builds
- S3 endpoint is a self-hosted MinIO instance at `chocha.duckdns.org` (HTTPS with InsecureRequestWarning — self-signed cert)

---

## 14. Known Edge Cases & Gotchas

### React Compiler (`babel-plugin-react-compiler` beta)
- `WorkoutScreen.js` uses `'use no memo'` directive at the top of the function to **opt out** of the React Compiler.
- **Why**: The compiler's beta hoists `activeWorkout.exercises` past the null-guard (`if (!activeWorkout)`), causing a crash on initial render when no workout is active.
- **Rule**: Any screen that accesses deeply nested fields of a nullable context value should either use `'use no memo'` or manually null-check before every access.

### MMKV Storage Key
- Single key `@solo_leveling_gym` stores the entire serialized state as JSON.
- Fields excluded from persistence: `isLoaded`, `showLevelUp`, `levelUpData`, `xpToasts`.
- `activeWorkout` **is** persisted — if the app crashes mid-workout, the session resumes.

### Stat XP Is Cumulative Raw Total
- `stats.STR` is not a "level" — it is total XP earned from STR exercises ever.
- `getStatLevel(statXP)` = `Math.floor(statXP / 200) + 1` converts it to a display level.
- Do **not** cap or reset stat XP.

### Workout History Capped at 100
- `workoutHistory` is sliced to 100 entries on `FINISH_WORKOUT`.

### Weight History Always Descending
- `logWeight()` inserts and sorts descending by date. Same-date entries **overwrite** (upsert).

### Measurements History — Partial Updates (Merge, Not Overwrite)
- `logMeasurement()` does a **merge** on same-date entries — logging only `chest` won't erase a previously logged `bicep` from the same date.
- Fields not present in the new payload are kept from the existing entry.
- `measurementsHistory` is sorted descending by date (newest first).
- All values are stored in **cm** only — unit conversion is not implemented for measurements.
- The three tracked metrics are: `bicep`, `chest`, `belly` (belly = waist circumference).

### WeightLogModal Has Two Tabs
- **Weight tab**: single large number input + kg/lbs toggle + Today/Yesterday date chips.
- **Measurements tab**: three inline fields (Bicep/Chest/Belly) with individual colour coding.
- Colour constants for measurements are defined inline in `WeightLogModal.js` and `WeightHistoryScreen.js` — keep them in sync if adding new metrics:
  ```js
  bicep: '#7c91ff'  (purple-blue)
  chest: '#ff7c7c'  (coral red)
  belly: '#7cffb8'  (mint green)
  ```
- Modal resets to the **Weight tab + today's date** every time it opens.

### Streak Logic
- Streak increments if previous `lastWorkoutDate` was exactly the **previous calendar day** (≤24h and not the same day).
- Working out twice on the same day does **not** break or increment the streak.

### Daily Quest Seeding
- Quests are seeded by `dateStr` (YYYY-MM-DD). Multiple devices on the same day see the same quests.
- `seededRandom(seed)` is a simple djb2 hash — not cryptographic.

### Exercise Duplicate Prevention
- `ADD_EXERCISE_TO_WORKOUT` reducer checks `workout.exercises.some(e => e.id === action.payload.id)` before inserting. Silently no-ops on duplicate.

### Remove Exercise Constraint
- The `trash icon` in `WorkoutScreen` only renders when `completedCount === 0` for that exercise to prevent accidentally deleting partially-completed sets.
- The reducer (`REMOVE_EXERCISE_FROM_WORKOUT`) filters the exercise out but does **not** delete the corresponding `completedSets` entry — this is safe as it just becomes unused.

### ExerciseItem vs ExerciseRow
- `ExerciseItem` (`src/components/ExerciseItem.js`) is the original reusable component used in older screens.
- `ExerciseRow` is an **inline component** defined inside `WorkoutScreen.js` that extends ExerciseItem with the trash-can remove button. Do not confuse the two.

### SoundManager Initialization
- `SoundManager.init()` is called **only inside** `onLayoutRootView` in `App.js`, after fonts are loaded.
- `playSound()` calls `this.init()` as a fallback but this is defensive only — sounds should always be initialized before use.

### Notification Foreground Suppression
- The `handleNotification` handler suppresses all banners in foreground **except** `isTest === true`.
- If you schedule a new notification type and need it to show in foreground, add `data: { isTest: true }` or create a new data flag and update the handler.

### OTA: Self-Signed TLS Certificate Warning
- The MinIO S3 endpoint at `chocha.duckdns.org` uses a self-signed certificate.
- AWS CLI is called with HTTP instead of verifying TLS (the upload still works, but `urllib3.InsecureRequestWarning` appears in CI logs — this is expected and non-blocking).

### Reanimated + React Compiler Compatibility
- `react-native-reanimated` 4.x and React Compiler beta can conflict on worklet functions.
- If you see "Worklet evaluation failed" errors, check that the affected component is opted out with `'use no memo'`.

### Stretch Timer Background-Resume
- The stretch timer stores an absolute wall-clock end time in `endTimeRef`. When the app goes to background on Android, `setInterval` freezes.
- On resume, two layers correct the timer:
  1. `AppState` event handler reads `endTimeRef` via refs (not closures) and forces a `setTimeRemaining` update.
  2. The `setInterval` callback always derives remaining time from `endTimeRef`, so even the first tick after resume self-corrects.
- **Do not** use state variables (`isTimerActive`, `isPaused`) in the `AppState` handler — always use refs to avoid stale closures.

### WeightChart Requires 2+ Data Points
- `WeightChart` returns `null` if `data.length < 2`. The chart only renders when there are at least 2 weight log entries.

### SectionList in AddExercise Modal
- `WorkoutScreen.js` uses `SectionList` (not `FlatList`) for the dungeon-grouped exercise browser.
- `stickySectionHeadersEnabled={false}` to avoid visual glitches on Android.
- Sections are derived from `DUNGEONS` filtered to exclude `warmup_stretching` and exercises already in the active workout.

---

## 15. Stat → Dungeon Mapping

| Stat | Dungeon | Split |
|---|---|---|
| STR | push (Crimson Fortress) | Push Day |
| PER | pull (Shadow Spire) | Pull Day |
| END | legs (Titan's Path) | Leg Day |
| VIT | recovery (Iron Sanctum) | Active Recovery |
| AGI | cardio (Wind Temple) | Cardio |
| INT | warmup_stretching (Arcane Grove) | Flexibility |

The suggestion engine reverse-maps stat → dungeon via:
```js
const statToDungeon = {};
DUNGEONS.forEach(d => { statToDungeon[d.stat] = d.id; });
```

---

## 16. Frequently Modified Files

When making changes, these are the files most commonly touched and their blast radius:

| File | What changes affect |
|---|---|
| `src/data/exercises.js` | Dungeon grid, exercise selection modal, suggestion engine, workout tracking |
| `src/store/PlayerContext.js` | All screens (global state) |
| `src/utils/suggestions.js` | The "SYSTEM SUGGESTION" card on DungeonsScreen |
| `src/theme.js` | Every single component's visual appearance |
| `src/screens/WorkoutScreen.js` | Active workout experience only |
| `src/screens/DungeonsScreen.js` | Dungeon selection + exercise picker modal |
| `src/utils/leveling.js` | XP display, level-up trigger, rank thresholds |
| `src/utils/quests.js` | Daily quest generation, reset logic |

---

## 17. Body Measurements Feature

### Entry Points
| Where | What |
|---|---|
| `HunterProfileScreen` → **LOG TODAY** button | Opens `WeightLogModal` — switch to Measurements tab |
| `WeightHistoryScreen` → **Measurements tab** | Shows latest snapshot + full history list |

### Data Flow
```
WeightLogModal (MeasurementsTab)
  → logMeasurement({ bicep, chest, belly }, 'cm', date)
    → LOG_MEASUREMENT reducer
      → merge into measurementsHistory[]
        → persisted via MMKV
```

### Display on Hunter Profile
A **BODY MEASUREMENTS** panel sits directly below the DAILY WEIGHT panel on `HunterProfileScreen`.
It shows the **three latest values** as coloured chips (or `–` if not yet logged).
Tapping LOG TODAY opens the modal with the Measurements tab pre-selectable.

### Adding a New Metric
1. Add the field to the `MEASUREMENT_FIELDS` array in `WeightLogModal.js`
2. Add the metric's color/icon/label to `METRIC_COLORS`, `METRIC_ICONS`, `METRIC_LABELS` in `WeightHistoryScreen.js`
3. Add it to the `METRICS` array in the inline panel in `HunterProfileScreen.js`
4. The reducer already handles arbitrary fields — no reducer changes needed
5. Update `APP_CONTEXT.md` §5.1 state shape

---

*Last updated: 2026-05-04. Update this file whenever the data model, dungeon split, or major
architectural patterns change.*
