import { describe, it, expect, beforeEach } from 'react-native-harness';
import { render, screen, userEvent } from '@react-native-harness/ui';
import { View, Text } from 'react-native';
import { storage } from '../src/store/storage';
import { PlayerProvider, usePlayer, ActionTypes } from '../src/store/PlayerContext';
import DailyQuestsScreen from '../src/screens/DailyQuestsScreen';

const STORAGE_KEY = '@solo_leveling_gym';

function QuestHarness() {
  const { dailyQuests, dispatch } = usePlayer();

  // Seed a deterministic daily quest list for the harness.
  if (dailyQuests.length === 0) {
    dispatch({
      type: ActionTypes.SET_QUESTS,
      payload: {
        date: new Date().toISOString().split('T')[0],
        quests: [
          {
            id: 'harness-quest-1',
            text: 'Push-ups x20',
            stat: 'STR',
            xpReward: 15,
            completed: false,
            isBonus: false,
          },
          {
            id: 'harness-quest-2',
            text: 'Squats x30',
            stat: 'VIT',
            xpReward: 20,
            completed: false,
            isBonus: false,
          },
          {
            id: 'harness-bonus',
            text: 'Bonus quest',
            stat: 'ALL',
            xpReward: 50,
            completed: false,
            isBonus: true,
          },
        ],
      },
    });
  }

  return <DailyQuestsScreen />;
}

describe('Quest flow', () => {
  beforeEach(() => {
    storage.delete(STORAGE_KEY);
    storage.delete('@solo_leveling_gym_backup');
  });

  it('displays seeded daily quests', async () => {
    await render(
      <PlayerProvider>
        <QuestHarness />
      </PlayerProvider>
    );

    const pushUps = await screen.findByAccessibilityLabel('Push-ups x20');
    expect(pushUps).toBeTruthy();
    expect(screen.queryByAccessibilityLabel('Squats x30')).toBeTruthy();
  });

  it('completes a quest and updates progress', async () => {
    await render(
      <PlayerProvider>
        <QuestHarness />
      </PlayerProvider>
    );

    const pushUps = await screen.findByAccessibilityLabel('Push-ups x20');
    await userEvent.press(pushUps);

    const progress = await screen.findByAccessibilityLabel('Quest Progress 1/2');
    expect(progress).toBeTruthy();
  });
});
