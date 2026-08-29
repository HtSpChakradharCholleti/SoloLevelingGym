# On-device harness tests

These tests are run by [React Native Harness](https://react-native-harness.dev)
inside a real React Native app on a simulator or device. They are intentionally
excluded from the Jest suite (`jest.config.js` ignores `__harness__/`).

## Running

Make sure you have a Debug build of the app installed on the target, then run:

```bash
yarn test:harness:ios
# or
yarn test:harness:android
```

## Writing tests

- Files must end with `.harness.js` or `.harness.ts`.
- Import `describe`, `it`, and `expect` from `react-native-harness`.
- Import `render`, `screen`, and `userEvent` from `@react-native-harness/ui`.
- Keep tests independent; storage is reset in `beforeEach` when testing persistence.

## Current harness tests

- `AppLaunch.harness.js` — smoke tests that the app renders and the profile tab loads.
- `PlayerPersistence.harness.js` — verifies default state and persisted XP changes.
- `QuestFlow.harness.js` — seeds daily quests and validates completion flow.
