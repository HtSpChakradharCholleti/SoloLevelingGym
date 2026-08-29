import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import QuestCard from '../../src/components/QuestCard';
import { MockPlayerProvider } from './test-utils';

const quest = {
  id: 'q1',
  text: 'Complete 50 Push-ups',
  stat: 'STR',
  xpReward: 50,
  completed: false,
  isBonus: false,
};

const bonusQuest = {
  id: 'bonus',
  text: 'Complete all daily quests',
  stat: 'ALL',
  xpReward: 100,
  completed: false,
  isBonus: true,
};

describe('QuestCard', () => {
  it('renders quest text, stat, and XP reward', async () => {
    await render(
      <MockPlayerProvider>
        <QuestCard quest={quest} onComplete={jest.fn()} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('Complete 50 Push-ups')).toBeTruthy();
    expect(screen.getByText('STR')).toBeTruthy();
    expect(screen.getByText('+50')).toBeTruthy();
    expect(screen.getByText('XP')).toBeTruthy();
  });

  it('calls onComplete with the quest when pressed', async () => {
    const onComplete = jest.fn();
    await render(
      <MockPlayerProvider>
        <QuestCard quest={quest} onComplete={onComplete} />
      </MockPlayerProvider>
    );
    fireEvent.press(screen.getByText('Complete 50 Push-ups'));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(quest);
  });

  it('does not call onComplete for already-completed quests', async () => {
    const onComplete = jest.fn();
    await render(
      <MockPlayerProvider>
        <QuestCard quest={{ ...quest, completed: true }} onComplete={onComplete} />
      </MockPlayerProvider>
    );
    fireEvent.press(screen.getByText('Complete 50 Push-ups'));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('shows the bonus badge for bonus quests', async () => {
    await render(
      <MockPlayerProvider>
        <QuestCard quest={bonusQuest} onComplete={jest.fn()} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('BONUS')).toBeTruthy();
    expect(screen.getByText('⭐ Complete all daily quests')).toBeTruthy();
  });
});
