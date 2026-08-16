import React from 'react';
import { usePlayer } from '../../store/PlayerContext';
const LevelUpOverlay = require('../LevelUpOverlay').default as any;
const WorkoutCompleteOverlay = require('../WorkoutCompleteOverlay').default as any;
const StreakMilestoneOverlay = require('../StreakMilestoneOverlay').default as any;

/**
 * Renders reward overlays on top of the navigation tree.
 * Priority: LevelUp → StreakMilestone → WorkoutComplete.
 * Dismissing the top one reveals the next, so a workout that hits
 * a milestone AND a level-up chains naturally.
 */
export default function Overlays() {
  const {
    showLevelUp,
    levelUpData,
    dismissLevelUp,
    workoutCompletionData,
    dismissWorkoutComplete,
    streakMilestoneData,
    dismissStreakMilestone,
  } = usePlayer();

  return (
    <>
      {showLevelUp && levelUpData ? (
        <LevelUpOverlay
          data={levelUpData as any}
          onDismiss={dismissLevelUp as any}
        />
      ) : streakMilestoneData ? (
        <StreakMilestoneOverlay
          data={streakMilestoneData as any}
          onDismiss={dismissStreakMilestone as any}
        />
      ) : workoutCompletionData ? (
        <WorkoutCompleteOverlay
          data={workoutCompletionData as any}
          onDismiss={dismissWorkoutComplete as any}
        />
      ) : null}
    </>
  );
}
