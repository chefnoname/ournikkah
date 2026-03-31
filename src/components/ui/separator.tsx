import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

type SeparatorOrientation = 'horizontal' | 'vertical';

interface SeparatorProps {
  orientation?: SeparatorOrientation;
  style?: ViewStyle;
}

const Separator = React.forwardRef<View, SeparatorProps>(
  ({ orientation = 'horizontal', style }, ref) => (
    <View
      ref={ref}
      style={[
        styles.separator,
        orientation === 'vertical'
          ? styles.separator__vertical
          : styles.separator__horizontal,
        style,
      ]}
    />
  )
);

Separator.displayName = 'Separator';

const styles = StyleSheet.create({
  separator: {
    backgroundColor: '#e5e7eb',
  },
  separator__horizontal: {
    height: 1,
    width: '100%',
  },
  separator__vertical: {
    width: 1,
    height: '100%',
  },
});

export { Separator };
