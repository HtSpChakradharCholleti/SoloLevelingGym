import React from 'react';
import PlayerContext from '../../src/store/PlayerContext';

/**
 * Minimal PlayerProvider for component tests.
 * Presentational components only read settings.animationsEnabled.
 */
export function MockPlayerProvider({ children, overrides = {} }) {
  const value = {
    settings: { animationsEnabled: true },
    ...overrides,
  };
  return (
    <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
  );
}
