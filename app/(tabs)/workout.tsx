import { View, StyleSheet } from 'react-native';

import WorkoutScreen from '../../src/screens/WorkoutScreen';
import { COLORS } from '../../src/theme';

export default function WorkoutRoute() {
  return (
    <View style={styles.container}>
      <WorkoutScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
