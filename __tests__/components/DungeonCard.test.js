import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import DungeonCard from '../../src/components/DungeonCard';
import { MockPlayerProvider } from './test-utils';

const dungeon = {
  id: 'push',
  name: 'Push Dungeon',
  subtitle: 'Chest, Shoulders & Triceps',
  icon: 'arm-flex',
  stat: 'STR',
  rank: 'E',
  splitLabel: 'Push Day',
};

describe('DungeonCard', () => {
  it('renders dungeon information', async () => {
    await render(
      <MockPlayerProvider>
        <DungeonCard dungeon={dungeon} onPress={jest.fn()} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('Push Dungeon')).toBeTruthy();
    expect(screen.getByText('Chest, Shoulders & Triceps')).toBeTruthy();
    expect(screen.getByText('Push Day')).toBeTruthy();
    expect(screen.getByText(/Rank E/)).toBeTruthy();
    expect(screen.getByText(/Excs/)).toBeTruthy();
  });

  it('calls onPress with the dungeon when pressed', async () => {
    const onPress = jest.fn();
    await render(
      <MockPlayerProvider>
        <DungeonCard dungeon={dungeon} onPress={onPress} />
      </MockPlayerProvider>
    );
    fireEvent.press(screen.getByText('Push Dungeon'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(dungeon);
  });
});
