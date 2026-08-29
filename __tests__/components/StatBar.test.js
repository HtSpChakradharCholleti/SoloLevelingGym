import React from 'react';
import { render, screen } from '@testing-library/react-native';
import StatBar from '../../src/components/StatBar';
import { MockPlayerProvider } from './test-utils';

describe('StatBar', () => {
  it('renders the label and computed level', async () => {
    await render(
      <MockPlayerProvider>
        <StatBar label="STR" value={250} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('STR')).toBeTruthy();
    // 250 / 200 + 1 -> level 2
    expect(screen.getByText('Lv.2')).toBeTruthy();
  });

  it('uses the provided level override', async () => {
    await render(
      <MockPlayerProvider>
        <StatBar label="STR" value={250} level={5} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('Lv.5')).toBeTruthy();
  });

  it('displays XP progress text', async () => {
    await render(
      <MockPlayerProvider>
        <StatBar label="VIT" value={250} />
      </MockPlayerProvider>
    );
    expect(screen.getByText('50 / 200')).toBeTruthy();
  });

  it('hides level text when showLevel is false', async () => {
    await render(
      <MockPlayerProvider>
        <StatBar label="AGI" value={100} showLevel={false} />
      </MockPlayerProvider>
    );
    expect(screen.queryByText(/Lv\./)).toBeNull();
  });
});
