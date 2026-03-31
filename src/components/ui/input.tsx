import React from 'react';
import {
    TextInputProps as RNTextInputProps,
    StyleSheet,
    TextInput,
} from 'react-native';

interface InputProps extends RNTextInputProps {}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ style, ...props }, ref) => (
    <TextInput
      ref={ref}
      style={[styles.input, style]}
      placeholderTextColor="#9ca3af"
      {...props}
    />
  )
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    minHeight: 36,
    width: '100%',
    borderRadius: 6,
    borderColor: '#d1d5db',
    borderWidth: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
  },
});

export { Input };
