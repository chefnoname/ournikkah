import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  options: RadioOption[];
  style?: ViewStyle;
  optionStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const RadioGroup = React.forwardRef<View, RadioGroupProps>(
  (
    { value, onValueChange, options, style, optionStyle, labelStyle },
    ref
  ) => {
    return (
      <View ref={ref} style={[styles.container, style]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[styles.option, optionStyle]}
            onPress={() => onValueChange?.(option.value)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.radio,
                value === option.value && styles.radio__selected,
              ]}
            >
              {value === option.value && (
                <View style={styles.radioDot} />
              )}
            </View>
            <Text style={[styles.label, labelStyle]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

RadioGroup.displayName = 'RadioGroup';

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderColor: '#d1d5db',
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radio__selected: {
    borderColor: '#000',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
  },
  label: {
    fontSize: 14,
    color: '#000',
  },
});

export { RadioGroup };
