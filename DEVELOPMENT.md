# SoloLevelingGym Development Guide

## 📋 Before Writing Code

**All developers and AI agents MUST read these pattern documents first:**

1. **[AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md)** ← **START HERE** for code generation
2. **[CODE_LOGIC_PATTERNS.md](./CODE_LOGIC_PATTERNS.md)** - Variable naming & logic patterns
3. **[CODE_STYLE_IDIOMS.md](./CODE_STYLE_IDIOMS.md)** - Detailed idioms & practices
4. **[UTILITY_PATTERNS.md](./UTILITY_PATTERNS.md)** - Reference implementations for helpers
5. **[PATTERNS_AND_CONVENTIONS.md](./PATTERNS_AND_CONVENTIONS.md)** - Architecture overview

---

## 🚀 Quick Start for Agents/Developers

### When Creating New Components:
1. Read [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) - **Component Rules** section
2. Check [CODE_STYLE_IDIOMS.md](./CODE_STYLE_IDIOMS.md) - **Variable Naming Quick Reference**
3. Use the component template in [PATTERNS_AND_CONVENTIONS.md](./PATTERNS_AND_CONVENTIONS.md)

### When Creating New Screens:
1. Read [AGENT_INSTRUCTIONS.md](./AGENT_INSTRUCTIONS.md) - **Screen Rules** section
2. Use template from [PATTERNS_AND_CONVENTIONS.md](./PATTERNS_AND_CONVENTIONS.md)

### When Creating Utility Functions:
1. Review [UTILITY_PATTERNS.md](./UTILITY_PATTERNS.md) for reference implementations
2. Follow error handling patterns from [CODE_LOGIC_PATTERNS.md](./CODE_LOGIC_PATTERNS.md)
3. Include JSDoc comments and try/catch blocks

### When Working with State:
1. Read [CODE_LOGIC_PATTERNS.md](./CODE_LOGIC_PATTERNS.md) - **State Management Patterns**
2. Follow 3-layer approach: PlayerContext (useReducer) + MMKV + component state
3. Use immutable updates (map/spread, never direct mutation)

---

## 📚 Document Index

| Document | Purpose | Best For |
|----------|---------|----------|
| **AGENT_INSTRUCTIONS.md** | Agent-focused rules by layer | Agents writing code |
| **CODE_LOGIC_PATTERNS.md** | Variable naming & logic analysis | Understanding code patterns |
| **CODE_STYLE_IDIOMS.md** | Detailed idioms & practices | Learning how to write code |
| **UTILITY_PATTERNS.md** | Reference function implementations | Building helpers/utilities |
| **PATTERNS_AND_CONVENTIONS.md** | Architecture & structure | Project organization |

---

## 🎯 Core Rules (Abbreviated)

### Always:
- ✅ Use `theme.js` for colors, fonts, sizes (`COLORS`, `FONTS`, `SPACING`, etc.)
- ✅ Use semantic variable names (`isLoading`, `showModal`, `hasWorkout`)
- ✅ Add PropTypes and defaultProps to all reusable components
- ✅ Add JSDoc comments to all reusable components
- ✅ Use functional components with React hooks
- ✅ Use `usePlayer()` from `PlayerContext` for global state
- ✅ Use `MMKV` (via `storage.js`) for disk persistence
- ✅ Guard clauses for early returns
- ✅ Immutable updates (map/spread, never direct mutation)
- ✅ Respect `settings.animationsEnabled` for all animations

### Never:
- ❌ Hardcode colors, fonts, sizes
- ❌ Use class components
- ❌ Create separate component variants (use props)
- ❌ Use Redux/MobX (use PlayerContext + MMKV)
- ❌ Inline styles in production
- ❌ Skip PropTypes on reusable components
- ❌ Directly mutate state or arrays

---

## 📍 File Structure

```
src/
├── components/          # Reusable UI components (flat)
│   ├── DungeonCard.js
│   ├── QuestCard.js
│   ├── ExerciseItem.js
│   ├── StatBar.js
│   ├── WeightChart.js
│   ├── WeightLogModal.js
│   ├── LevelUpOverlay.js
│   ├── XPToast.js
│   ├── SystemPanel.js
│   └── RankBadge.js
│
├── screens/             # Full-page screen components
│   ├── HunterProfileScreen.js
│   ├── DailyQuestsScreen.js
│   ├── DungeonsScreen.js
│   ├── WorkoutScreen.js
│   ├── HistoryScreen.js
│   ├── WeightHistoryScreen.js
│   └── StretchingScreen.js
│
├── store/               # State management
│   ├── PlayerContext.js  # useReducer + MMKV persistence
│   └── storage.js        # MMKV instance
│
├── navigation/          # React Navigation setup
│   └── AppNavigator.js
│
├── data/                # Static data definitions
│   └── exercises.js
│
├── utils/               # Utility modules
│   ├── SoundManager.js
│   ├── NotificationManager.js
│   ├── leveling.js
│   ├── quests.js
│   └── suggestions.js
│
└── theme.js             # Design tokens (COLORS, FONTS, SPACING, etc.)
```

---

## 🔍 Checklist Before Submitting Code

- [ ] Read AGENT_INSTRUCTIONS.md
- [ ] Used semantic variable names (is*, has*, show*, should*, etc.)
- [ ] All colors from `COLORS` in `theme.js`
- [ ] All sizes from `SPACING` / `FONT_SIZES` in `theme.js`
- [ ] All fonts from `FONTS` in `theme.js`
- [ ] Added PropTypes and defaultProps
- [ ] Added JSDoc comments
- [ ] Guard clauses for early returns
- [ ] Immutable state updates (no direct mutation)
- [ ] No hardcoded styles (used StyleSheet.create)
- [ ] Animations respect `settings.animationsEnabled`
- [ ] Structured import order (React → 3rd-party → Config → Components)
