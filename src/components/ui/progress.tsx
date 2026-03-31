import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

interface ProgressProps {
  value?: number;
  max?: number;
  style?: ViewStyle;
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ value = 0, max = 100, style }, ref) => {
    const percentage = (value / max) * 100;

    return (
      <View
        ref={ref}
        style={[styles.progressContainer, style]}
      >
        <View
          style={[
            styles.progressBar,
            {
              width: `${Math.min(percentage, 100)}%`,
            },
          ]}
        />
      </View>
    );
  }
);

Progress.displayName = 'Progress';

const styles = StyleSheet.create({
  progressContainer: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e5e7eb',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 4,
  },
});

export { Progress };
