import React from 'react';
import {
    Switch as RNSwitch,
    SwitchProps as RNSwitchProps,
    StyleSheet,
    ViewStyle,
} from 'react-native';

interface SwitchProps extends RNSwitchProps {
  style?: ViewStyle;
}

const Switch = React.forwardRef<RNSwitch, SwitchProps>(
  ({ style, ...props }, ref) => (
    <RNSwitch
      ref={ref}
      style={[styles.switch, style]}
      trackColor={{ false: '#d1d5db', true: '#a3e635' }}
      thumbColor={props.value ? '#000' : '#f3f4f6'}
      {...props}
    />
  )
);

Switch.displayName = 'Switch';

const styles = StyleSheet.create({
  switch: {
    alignSelf: 'flex-start',
  },
});

export { Switch };
