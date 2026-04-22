import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { processXPGain, getRankForLevel, getStatLevel } from '../utils/leveling';
import { generateDailyQuests, shouldResetQuests, getTodayString } from '../utils/quests';
import SoundManager from '../utils/SoundManager';

const STORAGE_KEY = '@solo_leveling_gym';

const PlayerContext = createContext(null);

const DEFAULT_STATS = {
  STR: 0,
  VIT: 0,
  AGI: 0,
  END: 0,
  INT: 0,
  PER: 0,
};

const initialState = {
  // Player
  playerName: 'Hunter',
  level: 1,
  xp: 0,
  rank: 'E',
  stats: { ...DEFAULT_STATS },
  totalWorkouts: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastWorkoutDate: null,

  // Daily Quests
  dailyQuests: [],
  lastQuestDate: null,

  // Active Workout
  activeWorkout: null,

  // History
  workoutHistory: [],
  weightHistory: [],    // [{ date: 'YYYY-MM-DD', weight: number, unit: 'kg' }]
  measurementsHistory: [], // [{ date: 'YYYY-MM-DD', bicep?: number, chest?: number, belly?: number, unit: 'cm' }]

  // UI State
  showLevelUp: false,
  levelUpData: null,
  xpToasts: [],

  // Settings
  settings: {
    animationsEnabled: true,
    bgmEnabled: true,
  },

  // Loaded
  isLoaded: false,
};

const ActionTypes = {
  LOAD_STATE: 'LOAD_STATE',
  SET_PLAYER_NAME: 'SET_PLAYER_NAME',
  GAIN_XP: 'GAIN_XP',
  GAIN_STAT_XP: 'GAIN_STAT_XP',
  SET_QUESTS: 'SET_QUESTS',
  COMPLETE_QUEST: 'COMPLETE_QUEST',
  START_WORKOUT: 'START_WORKOUT',
  ADD_EXERCISE_TO_WORKOUT: 'ADD_EXERCISE_TO_WORKOUT',
  REMOVE_EXERCISE_FROM_WORKOUT: 'REMOVE_EXERCISE_FROM_WORKOUT',
  COMPLETE_EXERCISE_SET: 'COMPLETE_EXERCISE_SET',
  FINISH_WORKOUT: 'FINISH_WORKOUT',
  CANCEL_WORKOUT: 'CANCEL_WORKOUT',
  DISMISS_LEVEL_UP: 'DISMISS_LEVEL_UP',
  ADD_XP_TOAST: 'ADD_XP_TOAST',
  REMOVE_XP_TOAST: 'REMOVE_XP_TOAST',
  LOG_WEIGHT: 'LOG_WEIGHT',
  LOG_MEASUREMENT: 'LOG_MEASUREMENT',
  RESET_ALL: 'RESET_ALL',
  SET_SETTING: 'SET_SETTING',
};

function playerReducer(state, action) {
  switch (action.type) {
    case ActionTypes.LOAD_STATE:
      return { ...state, ...action.payload, isLoaded: true };

    case ActionTypes.SET_PLAYER_NAME:
      return { ...state, playerName: action.payload };

    case ActionTypes.GAIN_XP: {
      const result = processXPGain(state.level, state.xp, action.payload.amount);
      return {
        ...state,
        level: result.newLevel,
        xp: result.newXP,
        rank: result.newRank,
        showLevelUp: result.levelsGained > 0,
        levelUpData: result.levelsGained > 0 ? {
          oldLevel: state.level,
          newLevel: result.newLevel,
          oldRank: result.oldRank,
          newRank: result.newRank,
          rankUp: result.rankUp,
        } : state.levelUpData,
      };
    }

    case ActionTypes.GAIN_STAT_XP: {
      const { stat, amount } = action.payload;
      return {
        ...state,
        stats: {
          ...state.stats,
          [stat]: (state.stats[stat] || 0) + amount,
        },
      };
    }

    case ActionTypes.SET_QUESTS:
      return {
        ...state,
        dailyQuests: action.payload.quests,
        lastQuestDate: action.payload.date,
      };

    case ActionTypes.COMPLETE_QUEST: {
      const questId = action.payload;
      const updatedQuests = state.dailyQuests.map(q =>
        q.id === questId ? { ...q, completed: true } : q
      );

      // Check if all non-bonus quests are completed
      const nonBonusQuests = updatedQuests.filter(q => !q.isBonus);
      const allCompleted = nonBonusQuests.every(q => q.completed);

      // Auto-complete bonus quest if all others are done
      const finalQuests = allCompleted
        ? updatedQuests.map(q => q.isBonus ? { ...q, completed: true } : q)
        : updatedQuests;

      return {
        ...state,
        dailyQuests: finalQuests,
      };
    }

    case ActionTypes.START_WORKOUT:
      return {
        ...state,
        activeWorkout: {
          exercises: action.payload.exercises,
          startTime: Date.now(),
          completedSets: {},
          xpEarned: 0,
          statXPEarned: {},
        },
      };

    case ActionTypes.ADD_EXERCISE_TO_WORKOUT: {
      const workout = state.activeWorkout;
      if (!workout) return state;
      // Prevent duplicates
      if (workout.exercises.some(e => e.id === action.payload.id)) return state;
      return {
        ...state,
        activeWorkout: {
          ...workout,
          exercises: [...workout.exercises, action.payload],
        },
      };
    }

    case ActionTypes.REMOVE_EXERCISE_FROM_WORKOUT: {
      const workout = state.activeWorkout;
      if (!workout) return state;
      return {
        ...state,
        activeWorkout: {
          ...workout,
          exercises: workout.exercises.filter(e => e.id !== action.payload),
        },
      };
    }

    case ActionTypes.COMPLETE_EXERCISE_SET: {
      const { exerciseId, setIndex, xp, stat } = action.payload;
      const workout = state.activeWorkout;
      if (!workout) return state;

      const exerciseSets = workout.completedSets[exerciseId] || [];
      exerciseSets[setIndex] = true;

      return {
        ...state,
        activeWorkout: {
          ...workout,
          completedSets: {
            ...workout.completedSets,
            [exerciseId]: [...exerciseSets],
          },
          xpEarned: workout.xpEarned + xp,
          statXPEarned: {
            ...workout.statXPEarned,
            [stat]: (workout.statXPEarned[stat] || 0) + xp,
          },
        },
      };
    }

    case ActionTypes.FINISH_WORKOUT: {
      const workout = state.activeWorkout;
      if (!workout) return state;

      const today = getTodayString();
      const isConsecutive = state.lastWorkoutDate &&
        isConsecutiveDay(state.lastWorkoutDate, today);

      const newStreak = isConsecutive ? state.currentStreak + 1 :
        (state.lastWorkoutDate === today ? state.currentStreak : 1);

      const historyEntry = {
        id: `workout_${Date.now()}`,
        date: today,
        startTime: workout.startTime,
        endTime: Date.now(),
        duration: Date.now() - workout.startTime,
        exercises: workout.exercises.map(e => ({
          id: e.id,
          name: e.name,
          completedSets: (workout.completedSets[e.id] || []).filter(Boolean).length,
          totalSets: e.sets,
        })),
        xpEarned: workout.xpEarned,
        statXPEarned: workout.statXPEarned,
      };

      return {
        ...state,
        activeWorkout: null,
        totalWorkouts: state.totalWorkouts + 1,
        currentStreak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
        lastWorkoutDate: today,
        workoutHistory: [historyEntry, ...state.workoutHistory].slice(0, 100),
      };
    }

    case ActionTypes.CANCEL_WORKOUT:
      return { ...state, activeWorkout: null };

    case ActionTypes.DISMISS_LEVEL_UP:
      return { ...state, showLevelUp: false, levelUpData: null };

    case ActionTypes.ADD_XP_TOAST:
      return {
        ...state,
        xpToasts: [...state.xpToasts, { id: Date.now(), ...action.payload }],
      };

    case ActionTypes.REMOVE_XP_TOAST:
      return {
        ...state,
        xpToasts: state.xpToasts.filter(t => t.id !== action.payload),
      };

    case ActionTypes.LOG_WEIGHT: {
      const { weight, unit, date } = action.payload;
      const newEntry = { weight, unit, date };
      
      const newHistory = [...(state.weightHistory || [])];
      const existingIdx = newHistory.findIndex(entry => entry.date === date);
      
      if (existingIdx >= 0) {
        newHistory[existingIdx] = newEntry;
      } else {
        newHistory.push(newEntry);
        newHistory.sort((a, b) => new Date(b.date) - new Date(a.date)); // descending
      }

      return {
        ...state,
        weightHistory: newHistory,
      };
    }

    case ActionTypes.LOG_MEASUREMENT: {
      const { date, bicep, chest, belly, unit } = action.payload;
      const newEntry = { date, unit };
      if (bicep  !== undefined) newEntry.bicep  = bicep;
      if (chest  !== undefined) newEntry.chest  = chest;
      if (belly  !== undefined) newEntry.belly  = belly;

      const newHistory = [...(state.measurementsHistory || [])];
      const idx = newHistory.findIndex(e => e.date === date);
      if (idx >= 0) {
        // Merge into existing entry for the same date
        newHistory[idx] = { ...newHistory[idx], ...newEntry };
      } else {
        newHistory.push(newEntry);
        newHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      return { ...state, measurementsHistory: newHistory };
    }

    case ActionTypes.RESET_ALL:
      return { ...initialState, isLoaded: true };

    case ActionTypes.SET_SETTING: {
      const { key, value } = action.payload;
      return {
        ...state,
        settings: {
          ...state.settings,
          [key]: value,
        },
      };
    }

    default:
      return state;
  }
}

function isConsecutiveDay(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1);
  const d2 = new Date(dateStr2);
  const diff = Math.abs(d2 - d1);
  return diff <= 86400000 && diff > 0; // within 24h but not same day
}

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  // Load saved state
  useEffect(() => {
    loadState();
  }, []);

  // Save state on changes
  useEffect(() => {
    if (state.isLoaded) {
      saveState(state);
    }
  }, [state]);

  // Check for daily quest reset
  useEffect(() => {
    if (state.isLoaded && shouldResetQuests(state.lastQuestDate)) {
      const quests = generateDailyQuests();
      dispatch({
        type: ActionTypes.SET_QUESTS,
        payload: { quests, date: getTodayString() },
      });
    }
  }, [state.isLoaded, state.lastQuestDate]);

  // Check for level ups and play sound
  useEffect(() => {
    if (state.showLevelUp) {
      SoundManager.playLevelUp();
    }
  }, [state.showLevelUp]);

  const loadState = () => {
    try {
      const saved = storage.getString(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        dispatch({ type: ActionTypes.LOAD_STATE, payload: parsed });
        // Sync BGM state with saved settings
        if (parsed.settings?.bgmEnabled === false) {
          SoundManager.pauseBGM();
        }
      } else {
        dispatch({ type: ActionTypes.LOAD_STATE, payload: {} });
      }
    } catch (e) {
      console.error('Failed to load state:', e);
      dispatch({ type: ActionTypes.LOAD_STATE, payload: {} });
    }
  };

  const saveState = (currentState) => {
    try {
      const toSave = { ...currentState };
      delete toSave.isLoaded;
      delete toSave.showLevelUp;
      delete toSave.levelUpData;
      delete toSave.xpToasts;
      storage.set(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save state:', e);
    }
  };

  const gainXP = useCallback((amount) => {
    dispatch({ type: ActionTypes.GAIN_XP, payload: { amount } });
  }, []);

  const gainStatXP = useCallback((stat, amount) => {
    dispatch({ type: ActionTypes.GAIN_STAT_XP, payload: { stat, amount } });
  }, []);

  const completeQuest = useCallback((questId, xpReward, stat) => {
    SoundManager.playQuestComplete();
    dispatch({ type: ActionTypes.COMPLETE_QUEST, payload: questId });
    gainXP(xpReward);
    if (stat && stat !== 'ALL') {
      gainStatXP(stat, Math.floor(xpReward * 0.5));
    }
    // If bonus quest, give XP to all stats
    if (stat === 'ALL') {
      ['STR', 'VIT', 'AGI', 'END', 'INT', 'PER'].forEach(s => {
        gainStatXP(s, 20);
      });
    }
  }, [gainXP, gainStatXP]);

  const startWorkout = useCallback((exercises) => {
    const formattedExercises = exercises.map(e => ({
      id: e.id,
      name: e.name,
      stat: e.stat,
      baseXP: e.baseXP,
      sets: e.defaultSets,
      reps: e.defaultReps,
    }));
    SoundManager.playTap();
    dispatch({ type: ActionTypes.START_WORKOUT, payload: { exercises: formattedExercises } });
  }, []);

  const addExerciseToWorkout = useCallback((exercise) => {
    // exercise should already be in the workout-ready format (id, name, stat, baseXP, sets, reps, repRange, muscle, icon)
    const formatted = {
      id: exercise.id,
      name: exercise.name,
      stat: exercise.stat,
      baseXP: exercise.baseXP,
      sets: exercise.defaultSets ?? exercise.sets,
      reps: exercise.defaultReps ?? exercise.reps,
      repRange: exercise.repRange,
      muscle: exercise.muscle,
      icon: exercise.icon,
    };
    SoundManager.playTap();
    dispatch({ type: ActionTypes.ADD_EXERCISE_TO_WORKOUT, payload: formatted });
  }, []);

  const removeExerciseFromWorkout = useCallback((exerciseId) => {
    SoundManager.playTap();
    dispatch({ type: ActionTypes.REMOVE_EXERCISE_FROM_WORKOUT, payload: exerciseId });
  }, []);

  const completeExerciseSet = useCallback((exerciseId, setIndex, xp, stat) => {
    SoundManager.playTap();
    dispatch({
      type: ActionTypes.COMPLETE_EXERCISE_SET,
      payload: { exerciseId, setIndex, xp, stat },
    });
  }, []);

  const finishWorkout = useCallback(() => {
    SoundManager.playQuestComplete();
    if (state.activeWorkout) {
      // Apply stat XP gains
      Object.entries(state.activeWorkout.statXPEarned).forEach(([stat, xp]) => {
        gainStatXP(stat, xp);
      });
      // Apply total XP
      gainXP(state.activeWorkout.xpEarned);
    }
    dispatch({ type: ActionTypes.FINISH_WORKOUT });
  }, [state.activeWorkout, gainXP, gainStatXP]);

  const cancelWorkout = useCallback(() => {
    SoundManager.playTap();
    dispatch({ type: ActionTypes.CANCEL_WORKOUT });
  }, []);

  const dismissLevelUp = useCallback(() => {
    SoundManager.playTap();
    dispatch({ type: ActionTypes.DISMISS_LEVEL_UP });
  }, []);

  const setPlayerName = useCallback((name) => {
    dispatch({ type: ActionTypes.SET_PLAYER_NAME, payload: name });
  }, []);

  const logWeight = useCallback((weight, unit = 'kg', date) => {
    const today = date || getTodayString();
    SoundManager.playLevelUp();
    dispatch({
      type: ActionTypes.LOG_WEIGHT,
      payload: { weight, unit, date: today }
    });
  }, []);

  const logMeasurement = useCallback((measurements, unit = 'cm', date) => {
    const today = date || getTodayString();
    SoundManager.playTap();
    dispatch({
      type: ActionTypes.LOG_MEASUREMENT,
      payload: { ...measurements, unit, date: today },
    });
  }, []);

  const updateSetting = useCallback((key, value) => {
    dispatch({ type: ActionTypes.SET_SETTING, payload: { key, value } });
    // Handle BGM toggle immediately
    if (key === 'bgmEnabled') {
      if (value) {
        SoundManager.resumeBGM();
      } else {
        SoundManager.pauseBGM();
      }
    }
  }, []);

  const resetAll = useCallback(() => {
    try {
      storage.delete(STORAGE_KEY);
      dispatch({ type: ActionTypes.RESET_ALL });
    } catch (e) {
      console.error('Failed to reset:', e);
    }
  }, []);

  const value = {
    ...state,
    weightHistory: state.weightHistory || [],
    measurementsHistory: state.measurementsHistory || [],
    gainXP,
    gainStatXP,
    completeQuest,
    startWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    completeExerciseSet,
    finishWorkout,
    cancelWorkout,
    dismissLevelUp,
    setPlayerName,
    logWeight,
    logMeasurement,
    updateSetting,
    resetAll,
  };

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export default PlayerContext;
