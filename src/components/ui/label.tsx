import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

interface LabelProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

const Label = React.forwardRef<Text, LabelProps>(({ children, style }, ref) => (
  <Text ref={ref} style={[styles.label, style]}>
    {children}
  </Text>
));

Label.displayName = 'Label';

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#000',
  },
});

export { Label };
