import {
  playerReducer,
  initialState,
  ActionTypes,
  migrateState,
} from '../../../src/store/PlayerContext';

function dispatch(state, type, payload) {
  return playerReducer(state, { type, payload });
}

describe('playerReducer', () => {
  it('LOAD_STATE merges payload and marks state as loaded', () => {
    const next = dispatch(initialState, ActionTypes.LOAD_STATE, {
      playerName: 'Shadow',
      level: 5,
    });
    expect(next.playerName).toBe('Shadow');
    expect(next.level).toBe(5);
    expect(next.isLoaded).toBe(true);
  });

  it('SET_PLAYER_NAME updates the player name', () => {
    const next = dispatch(initialState, ActionTypes.SET_PLAYER_NAME, 'Igris');
    expect(next.playerName).toBe('Igris');
  });

  it('GAIN_XP levels up and surfaces level-up data', () => {
    // Level 1 needs 110 XP; gain 150 -> level 2 with 40 XP.
    const next = dispatch(initialState, ActionTypes.GAIN_XP, { amount: 150 });
    expect(next.level).toBe(2);
    expect(next.xp).toBe(40);
    expect(next.showLevelUp).toBe(true);
    expect(next.levelUpData).toMatchObject({
      oldLevel: 1,
      newLevel: 2,
      oldRank: 'E',
      newRank: 'E',
      rankUp: false,
    });
  });

  it('GAIN_STAT_XP increments the chosen stat', () => {
    const next = dispatch(initialState, ActionTypes.GAIN_STAT_XP, {
      stat: 'STR',
      amount: 75,
    });
    expect(next.stats.STR).toBe(75);
    expect(next.stats.VIT).toBe(0);
  });

  it('SET_QUESTS stores quests and date', () => {
    const quests = [{ id: 'q1' }, { id: 'q2' }];
    const next = dispatch(initialState, ActionTypes.SET_QUESTS, {
      quests,
      date: '2026-08-25',
    });
    expect(next.dailyQuests).toEqual(quests);
    expect(next.lastQuestDate).toBe('2026-08-25');
  });

  it('COMPLETE_QUEST marks a quest complete and auto-completes bonus', () => {
    const state = {
      ...initialState,
      dailyQuests: [
        { id: 'q1', completed: false, isBonus: false },
        { id: 'q2', completed: false, isBonus: false },
        { id: 'bonus', completed: false, isBonus: true },
      ],
    };
    const afterFirst = dispatch(state, ActionTypes.COMPLETE_QUEST, 'q1');
    expect(afterFirst.dailyQuests[0].completed).toBe(true);
    expect(afterFirst.dailyQuests[2].completed).toBe(false);

    const afterSecond = dispatch(afterFirst, ActionTypes.COMPLETE_QUEST, 'q2');
    expect(afterSecond.dailyQuests[1].completed).toBe(true);
    expect(afterSecond.dailyQuests[2].completed).toBe(true);
  });

  it('START_WORKOUT initializes an active workout', () => {
    const exercises = [{ id: 'ex1', name: 'Push-ups' }];
    const next = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises,
    });
    expect(next.activeWorkout).toMatchObject({
      exercises,
      completedSets: {},
      exerciseWeights: {},
      exerciseCardioParams: {},
      xpEarned: 0,
      statXPEarned: {},
    });
    expect(next.activeWorkout.startTime).toBeGreaterThan(0);
  });

  it('ADD_EXERCISE_TO_WORKOUT appends a new exercise', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    const next = dispatch(state, ActionTypes.ADD_EXERCISE_TO_WORKOUT, {
      id: 'ex2',
      name: 'Squats',
    });
    expect(next.activeWorkout.exercises).toHaveLength(2);
    expect(next.activeWorkout.exercises[1].id).toBe('ex2');
  });

  it('ADD_EXERCISE_TO_WORKOUT ignores duplicates', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    const next = dispatch(state, ActionTypes.ADD_EXERCISE_TO_WORKOUT, {
      id: 'ex1',
    });
    expect(next.activeWorkout.exercises).toHaveLength(1);
  });

  it('REMOVE_EXERCISE_FROM_WORKOUT filters by id', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }, { id: 'ex2' }],
    });
    const next = dispatch(state, ActionTypes.REMOVE_EXERCISE_FROM_WORKOUT, 'ex1');
    expect(next.activeWorkout.exercises).toHaveLength(1);
    expect(next.activeWorkout.exercises[0].id).toBe('ex2');
  });

  it('COMPLETE_EXERCISE_SET records set completion, XP, and stat XP', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    const next = dispatch(state, ActionTypes.COMPLETE_EXERCISE_SET, {
      exerciseId: 'ex1',
      setIndex: 0,
      xp: 25,
      stat: 'STR',
    });
    expect(next.activeWorkout.completedSets.ex1).toEqual([true]);
    expect(next.activeWorkout.xpEarned).toBe(25);
    expect(next.activeWorkout.statXPEarned.STR).toBe(25);
  });

  it('SET_EXERCISE_WEIGHT stores weight for an exercise', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    const next = dispatch(state, ActionTypes.SET_EXERCISE_WEIGHT, {
      exerciseId: 'ex1',
      weight: 80,
    });
    expect(next.activeWorkout.exerciseWeights.ex1).toBe(80);
  });

  it('SET_EXERCISE_CARDIO_PARAMS preserves existing fields on partial update', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    let next = dispatch(state, ActionTypes.SET_EXERCISE_CARDIO_PARAMS, {
      exerciseId: 'ex1',
      speed: 8.5,
    });
    expect(next.activeWorkout.exerciseCardioParams.ex1).toEqual({
      speed: 8.5,
      incline: null,
    });

    next = dispatch(next, ActionTypes.SET_EXERCISE_CARDIO_PARAMS, {
      exerciseId: 'ex1',
      incline: 2,
    });
    expect(next.activeWorkout.exerciseCardioParams.ex1).toEqual({
      speed: 8.5,
      incline: 2,
    });
  });

  it('FINISH_WORKOUT moves active workout to history and updates streak', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1', sets: 3, name: 'Push-ups' }],
    });
    let active = dispatch(state, ActionTypes.COMPLETE_EXERCISE_SET, {
      exerciseId: 'ex1',
      setIndex: 0,
      xp: 25,
      stat: 'STR',
    });
    active = dispatch(active, ActionTypes.FINISH_WORKOUT);
    expect(active.activeWorkout).toBeNull();
    expect(active.workoutHistory).toHaveLength(1);
    expect(active.totalWorkouts).toBe(1);
    expect(active.currentStreak).toBe(1);
    expect(active.workoutCompletionData).toMatchObject({
      xpEarned: 25,
      exerciseCount: 1,
      setsCompleted: 1,
      totalSets: 3,
    });
  });

  it('FINISH_WORKOUT caps duration beyond 3 hours', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1', sets: 1, name: 'Push-ups' }],
    });
    // Simulate a workout started 4 hours ago.
    state.activeWorkout.startTime = Date.now() - 4 * 60 * 60 * 1000;
    const next = dispatch(state, ActionTypes.FINISH_WORKOUT);
    expect(next.workoutHistory[0].duration).toBeLessThanOrEqual(
      2 * 60 * 60 * 1000 + 1
    );
  });

  it('CANCEL_WORKOUT clears the active workout without history', () => {
    const state = dispatch(initialState, ActionTypes.START_WORKOUT, {
      exercises: [{ id: 'ex1' }],
    });
    const next = dispatch(state, ActionTypes.CANCEL_WORKOUT);
    expect(next.activeWorkout).toBeNull();
    expect(next.workoutHistory).toHaveLength(0);
  });

  it('LOG_WEIGHT appends and sorts entries, merging same-date entries', () => {
    let state = dispatch(initialState, ActionTypes.LOG_WEIGHT, {
      weight: 80,
      unit: 'kg',
      date: '2026-08-20',
    });
    state = dispatch(state, ActionTypes.LOG_WEIGHT, {
      weight: 79,
      unit: 'kg',
      date: '2026-08-25',
    });
    expect(state.weightHistory).toHaveLength(2);
    expect(state.weightHistory[0].date).toBe('2026-08-25');

    state = dispatch(state, ActionTypes.LOG_WEIGHT, {
      weight: 78.5,
      unit: 'kg',
      date: '2026-08-25',
    });
    expect(state.weightHistory).toHaveLength(2);
    expect(state.weightHistory[0].weight).toBe(78.5);
  });

  it('LOG_MEASUREMENT merges same-date entries and preserves separate dates', () => {
    let state = dispatch(initialState, ActionTypes.LOG_MEASUREMENT, {
      date: '2026-08-25',
      bicep: 35,
      unit: 'cm',
    });
    state = dispatch(state, ActionTypes.LOG_MEASUREMENT, {
      date: '2026-08-25',
      chest: 100,
      unit: 'cm',
    });
    expect(state.measurementsHistory).toHaveLength(1);
    expect(state.measurementsHistory[0]).toMatchObject({
      date: '2026-08-25',
      bicep: 35,
      chest: 100,
      unit: 'cm',
    });
  });

  it('SET_SETTING updates a single setting immutably', () => {
    const next = dispatch(initialState, ActionTypes.SET_SETTING, {
      key: 'bgmEnabled',
      value: false,
    });
    expect(next.settings.bgmEnabled).toBe(false);
    expect(next.settings.animationsEnabled).toBe(true);
  });

  it('default settings include notificationsEnabled', () => {
    expect(initialState.settings.notificationsEnabled).toBe(true);
  });

  it('default settings include shapeMode rounded', () => {
    expect(initialState.settings.shapeMode).toBe('rounded');
  });

  it('default state includes gymLocation and geofenceEnabled', () => {
    expect(initialState.gymLocation).toBeNull();
    expect(initialState.settings.geofenceEnabled).toBe(true);
  });

  it('SET_GYM_LOCATION stores the gym location', () => {
    const gym = { latitude: 37.77, longitude: -122.41, radius: 200 };
    const next = dispatch(initialState, ActionTypes.SET_GYM_LOCATION, gym);
    expect(next.gymLocation).toEqual(gym);
  });

  it('SET_GYM_LOCATION clears the gym when set to null', () => {
    const withGym = dispatch(initialState, ActionTypes.SET_GYM_LOCATION, {
      latitude: 1,
      longitude: 2,
      radius: 150,
    });
    const cleared = dispatch(withGym, ActionTypes.SET_GYM_LOCATION, null);
    expect(cleared.gymLocation).toBeNull();
  });

  describe('migrateState', () => {
    it('backfills notificationsEnabled for v2 state and advances to current version', () => {
      const v2 = {
        schemaVersion: 2,
        settings: {
          animationsEnabled: true,
          bgmEnabled: true,
          hapticsEnabled: true,
          weightUnit: 'kg',
        },
      };
      const migrated = migrateState(v2);
      expect(migrated.settings.notificationsEnabled).toBe(true);
      expect(migrated.schemaVersion).toBe(4);
    });

    it('preserves an explicit notificationsEnabled value when migrating', () => {
      const v2 = {
        schemaVersion: 2,
        settings: {
          notificationsEnabled: false,
          weightUnit: 'lbs',
        },
      };
      const migrated = migrateState(v2);
      expect(migrated.settings.notificationsEnabled).toBe(false);
      expect(migrated.settings.weightUnit).toBe('lbs');
    });

    it('backfills gymLocation and geofenceEnabled for v3 state', () => {
      const v3 = {
        schemaVersion: 3,
        settings: {
          notificationsEnabled: true,
          weightUnit: 'kg',
        },
      };
      const migrated = migrateState(v3);
      expect(migrated.schemaVersion).toBe(4);
      expect(migrated.gymLocation).toBeNull();
      expect(migrated.settings.geofenceEnabled).toBe(true);
    });

    it('preserves an existing gymLocation and geofenceEnabled when migrating', () => {
      const v3 = {
        schemaVersion: 3,
        gymLocation: { latitude: 35.1, longitude: 136.9, radius: 300 },
        settings: { geofenceEnabled: false },
      };
      const migrated = migrateState(v3);
      expect(migrated.gymLocation).toEqual({ latitude: 35.1, longitude: 136.9, radius: 300 });
      expect(migrated.settings.geofenceEnabled).toBe(false);
    });

    it('backfills shapeMode for v3 state', () => {
      const v3 = {
        schemaVersion: 3,
        settings: {
          notificationsEnabled: true,
          weightUnit: 'kg',
        },
      };
      const migrated = migrateState(v3);
      expect(migrated.schemaVersion).toBe(4);
      expect(migrated.settings.shapeMode).toBe('rounded');
    });

    it('preserves an explicit shapeMode value when migrating', () => {
      const v3 = {
        schemaVersion: 3,
        settings: {
          weightUnit: 'lbs',
          notificationsEnabled: false,
          shapeMode: 'square',
        },
      };
      const migrated = migrateState(v3);
      expect(migrated.schemaVersion).toBe(4);
      expect(migrated.settings.shapeMode).toBe('square');
    });
  });

  it('DISMISS_LEVEL_UP clears level-up state', () => {
    const state = dispatch(initialState, ActionTypes.GAIN_XP, { amount: 150 });
    const next = dispatch(state, ActionTypes.DISMISS_LEVEL_UP);
    expect(next.showLevelUp).toBe(false);
    expect(next.levelUpData).toBeNull();
  });

  it('RESET_ALL returns fresh initial state marked loaded', () => {
    const state = dispatch(initialState, ActionTypes.GAIN_XP, { amount: 150 });
    const next = dispatch(state, ActionTypes.RESET_ALL);
    expect(next).toEqual({ ...initialState, isLoaded: true });
  });
});
