import { describe, it, expect, beforeEach } from 'react-native-harness';
import { render, screen, userEvent } from '@react-native-harness/ui';
import { Text, View } from 'react-native';
import { storage } from '../src/store/storage';
import { PlayerProvider, usePlayer } from '../src/store/PlayerContext';

const STORAGE_KEY = '@solo_leveling_gym';

function TestConsumer() {
  const { playerName, level, xp, gainXP } = usePlayer();
  return (
    <View testID="player-summary">
      <Text testID="player-name">{playerName}</Text>
      <Text testID="player-level">Level {level}</Text>
      <Text testID="player-xp">{xp} XP</Text>
      <Text testID="gain-xp-button" onPress={() => gainXP(100)}>
        Gain XP
      </Text>
    </View>
  );
}

describe('Player persistence', () => {
  beforeEach(() => {
    storage.delete(STORAGE_KEY);
    storage.delete('@solo_leveling_gym_backup');
  });

  it('loads default hunter state when storage is empty', async () => {
    await render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );

    expect(screen.getByTestId('player-name').queryByType(Text).props.children).toBe('Hunter');
    expect(screen.getByTestId('player-level').queryByType(Text).props.children).toContain('1');
  });

  it('persists XP gain across provider re-mounts', async () => {
    await render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );

    const button = screen.getByTestId('gain-xp-button');
    await userEvent.press(button);

    // Re-render with a fresh provider instance to force loading from storage.
    await render(
      <PlayerProvider>
        <TestConsumer />
      </PlayerProvider>
    );

    const xpText = screen.getByTestId('player-xp').queryByType(Text).props.children;
    expect(xpText).toBeGreaterThan(0);
  });
});
