import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import useShapeStyles from '../../src/utils/useShapeStyles';
import { BORDER_RADIUS, applyShapeMode } from '../../src/theme';
import { MockPlayerProvider } from './test-utils';

// A styles factory that reads the shape token, so the rendered text reflects
// whichever radius scale is active when the factory runs.
const makeTestStyles = () => ({ box: { borderRadius: BORDER_RADIUS.md } });

// Render the radius the hook currently resolved, so we can assert the hook
// actually rebuilt its styles (not returned a stale cached copy).
function Shaped() {
  const styles = useShapeStyles(makeTestStyles);
  return <Text>{String(styles.box.borderRadius)}</Text>;
}

// Stateful harness: drive the shape mode through a real state change so the
// provider re-renders with a new context value. This mirrors what happens when
// a user taps the Corners toggle on the Profile screen.
function ToggleHarness({ initial = 'rounded' }) {
  const [mode, setMode] = useState(initial);
  return (
    <MockPlayerProvider overrides={{ settings: { shapeMode: mode } }}>
      <Shaped />
      <TouchableOpacity
        accessibilityLabel="toggle"
        onPress={() => setMode(mode === 'rounded' ? 'square' : 'rounded')}
      >
        <Text>toggle</Text>
      </TouchableOpacity>
    </MockPlayerProvider>
  );
}

// Reset the shared radius scale after each case — the hook mutates the global
// BORDER_RADIUS in place, and we must not leak state into other suites.
afterEach(() => {
  applyShapeMode('rounded');
});

describe('useShapeStyles', () => {
  it('builds rounded styles by default when no provider is present', async () => {
    // No provider -> hook defaults to 'rounded' (BORDER_RADIUS.md = 10).
    const { getByText } = await render(
      <MockPlayerProvider>
        <Shaped />
      </MockPlayerProvider>
    );
    expect(getByText('10')).toBeTruthy();
  });

  it('rebuilds styles when switching rounded -> square', async () => {
    const { getByText, getByLabelText } = await render(<ToggleHarness initial="rounded" />);
    expect(getByText('10')).toBeTruthy();

    await fireEvent.press(getByLabelText('toggle'));
    expect(getByText('0')).toBeTruthy();
  });

  it('rebuilds styles when switching back square -> rounded (regression)', async () => {
    // The exact direction that was broken: the memo must re-run when the mode
    // flips back, restoring the rounded radius instead of caching the square one.
    const { getByText, getByLabelText, queryByText } = await render(<ToggleHarness initial="square" />);
    expect(getByText('0')).toBeTruthy();

    await fireEvent.press(getByLabelText('toggle'));
    expect(getByText('10')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });
});
