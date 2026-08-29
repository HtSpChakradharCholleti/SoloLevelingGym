import { describe, it, expect } from 'react-native-harness';
import { render, screen } from '@react-native-harness/ui';
import { Text } from 'react-native';

describe('App launch', () => {
  it('renders the root app without crashing', async () => {
    const App = require('../../app/_layout').default;
    await render(<App />);

    // The root layout wraps the app in a PlayerProvider and renders a Stack.
    // We only assert that the harness mounted the tree successfully.
    expect(screen.queryByTestId('harness-root')).toBeNull();
  });

  it('shows the hunter profile tab as the initial screen', async () => {
    const App = require('../../app/_layout').default;
    await render(<App />);

    // Wait for fonts / layout to settle, then assert profile content is visible.
    const label = await screen.findByAccessibilityLabel('Hunter profile');
    expect(label).toBeTruthy();
  });
});
