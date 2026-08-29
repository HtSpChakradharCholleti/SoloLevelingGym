import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RankBadge from '../../src/components/RankBadge';

describe('RankBadge', () => {
  it.each(['E', 'D', 'C', 'B', 'A', 'S'])('renders rank %s and label', async (rank) => {
    await render(<RankBadge rank={rank} />);
    expect(screen.getByText(rank)).toBeTruthy();
    expect(screen.getByText(`${rank}-RANK`)).toBeTruthy();
  });

  it('hides the label when showLabel is false', async () => {
    await render(<RankBadge rank="A" showLabel={false} />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.queryByText('A-RANK')).toBeNull();
  });

  it('renders all size variants without crashing', async () => {
    for (const size of ['small', 'medium', 'large']) {
      const { getByText } = await render(<RankBadge rank="S" size={size} />);
      expect(getByText('S')).toBeTruthy();
    }
  });
});
