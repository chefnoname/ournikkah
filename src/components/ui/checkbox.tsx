import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface CheckboxProps {
  checked?: boolean;
  disabled?: boolean;
  onPress?: (checked: boolean) => void;
  label?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const Checkbox = React.forwardRef<View, CheckboxProps>(
  (
    { checked = false, disabled = false, onPress, label, style, labelStyle },
    ref
  ) => {
    const handlePress = () => {
      if (!disabled && onPress) {
        onPress(!checked);
      }
    };

    return (
      <TouchableOpacity
        ref={ref}
        style={[styles.container, style]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            checked && styles.checkbox__checked,
            disabled && styles.disabled,
          ]}
        >
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
        {label && (
          <Text style={[styles.label, disabled && styles.labelDisabled, labelStyle]}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    );
  }
);

Checkbox.displayName = 'Checkbox';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderColor: '#d1d5db',
    borderWidth: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox__checked: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 14,
    color: '#000',
  },
  labelDisabled: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
});

export { Checkbox };
