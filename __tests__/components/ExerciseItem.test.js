import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ExerciseItem from '../../src/components/ExerciseItem';
import { MockPlayerProvider } from './test-utils';

const exercise = {
  id: 'push_ups',
  name: 'Push-ups',
  stat: 'STR',
  baseXP: 15,
  icon: 'arm-flex',
  reps: 15,
  repRange: '12-15',
  muscle: 'Chest',
};

describe('ExerciseItem', () => {
  it('renders exercise name, meta, and muscle tag', async () => {
    await render(
      <MockPlayerProvider>
        <ExerciseItem exercise={exercise} totalSets={3} completedSets={[]} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('Push-ups')).toBeTruthy();
    expect(screen.getByText(/3 sets/)).toBeTruthy();
    expect(screen.getByText(/\+15\s*XP/)).toBeTruthy();
    expect(screen.getByText('Chest')).toBeTruthy();
  });

  it('renders one button per set', async () => {
    await render(
      <MockPlayerProvider>
        <ExerciseItem exercise={exercise} totalSets={4} completedSets={[true, false, false, false]} />
      </MockPlayerProvider>
    );
    expect(screen.getAllByText(/^[1-4]$/)).toHaveLength(3);
  });

  it('calls onCompleteSet when an incomplete set is tapped', async () => {
    const onCompleteSet = jest.fn();
    await render(
      <MockPlayerProvider>
        <ExerciseItem
          exercise={exercise}
          totalSets={3}
          completedSets={[]}
          onCompleteSet={onCompleteSet}
        />
      </MockPlayerProvider>
    );
    fireEvent.press(screen.getByText('1'));
    expect(onCompleteSet).toHaveBeenCalledWith('push_ups', 0);
  });

  it('does not call onCompleteSet for completed sets', async () => {
    const onCompleteSet = jest.fn();
    await render(
      <MockPlayerProvider>
        <ExerciseItem
          exercise={exercise}
          totalSets={2}
          completedSets={[true, false]}
          onCompleteSet={onCompleteSet}
        />
      </MockPlayerProvider>
    );
    // Completed set shows a check icon, not the number.
    expect(screen.queryAllByText('1')).toHaveLength(0);
    // Tapping the remaining incomplete set still works.
    fireEvent.press(screen.getByText('2'));
    expect(onCompleteSet).toHaveBeenCalledWith('push_ups', 1);
  });

  it('does not render set buttons when showAction is false', async () => {
    await render(
      <MockPlayerProvider>
        <ExerciseItem
          exercise={exercise}
          totalSets={3}
          completedSets={[]}
          showAction={false}
        />
      </MockPlayerProvider>
    );
    expect(screen.queryAllByText(/^[1-3]$/)).toHaveLength(0);
  });
});
