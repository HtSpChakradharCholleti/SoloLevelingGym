import React, { useState, act } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import useShapeStyles from '../../src/utils/useShapeStyles';
import { resetShapeScale } from '../../src/utils/shapeScale';
import { BORDER_RADIUS } from '../../src/theme';
import { MockPlayerProvider } from './test-utils';

// A styles factory that reads the live shape token, so the rendered text
// reflects the radius scale at the moment the factory runs.
const makeTestStyles = () => ({ box: { borderRadius: BORDER_RADIUS.md } });

// Render the radius the hook currently resolved, so we can assert the styles
// were rebuilt (and see the value mid-animation).
function Shaped() {
  const styles = useShapeStyles(makeTestStyles);
  return <Text>{String(styles.box.borderRadius)}</Text>;
}

// Stateful harness: drive the shape mode through a real state change so the
// provider re-renders with a new context value — mirrors tapping the Corners
// toggle on the Profile screen.
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

// The scale store is module-global and animates on a timer (RAF falls back to
// a 16ms timer in the Jest env) — drive it with fake timers.
beforeEach(() => {
  jest.useFakeTimers();
  resetShapeScale();
});
afterEach(() => {
  jest.useRealTimers();
  resetShapeScale();
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

  it('morphs gradually from rounded to square, then settles at 0', async () => {
    const { getByText, getByLabelText } = await render(<ToggleHarness initial="rounded" />);
    expect(getByText('10')).toBeTruthy();

    await fireEvent.press(getByLabelText('toggle'));

    // Mid-animation the radius is strictly between the two endpoints —
    // this is what distinguishes a gradual morph from an instant snap.
    await act(() => {
      jest.advanceTimersByTime(140); // ~halfway through the 280ms ease
    });
    const mid = Number(getByText(/\d+(\.\d+)?/).props.children);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(10);

    // Settling lands exactly on the square scale.
    await act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(getByText('0')).toBeTruthy();
  });

  it('morphs back from square to rounded (regression: reverse direction)', async () => {
    const { getByText, getByLabelText, queryByText } = await render(<ToggleHarness initial="square" />);
    expect(getByText('0')).toBeTruthy();

    await fireEvent.press(getByLabelText('toggle'));

    await act(() => {
      jest.advanceTimersByTime(140);
    });
    const mid = Number(getByText(/\d+(\.\d+)?/).props.children);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(10);

    await act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(getByText('10')).toBeTruthy();
    expect(queryByText('0')).toBeNull();
  });

  it('restarts the animation from the current value on rapid re-toggle', async () => {
    const { getByText, getByLabelText } = await render(<ToggleHarness initial="rounded" />);

    // Start heading to square...
    await fireEvent.press(getByLabelText('toggle'));
    await act(() => {
      jest.advanceTimersByTime(140);
    });
    const afterFirst = Number(getByText(/\d+(\.\d+)?/).props.children);

    // ...then flip back before it settles. No jump: the value keeps moving
    // smoothly from wherever it was.
    await fireEvent.press(getByLabelText('toggle'));
    await act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(getByText('10')).toBeTruthy();
    expect(afterFirst).toBeGreaterThan(0);
  });
});
