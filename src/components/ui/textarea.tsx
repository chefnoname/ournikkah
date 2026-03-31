import React from 'react';
import {
    TextInputProps as RNTextInputProps,
    StyleSheet,
    TextInput,
} from 'react-native';

interface TextareaProps extends RNTextInputProps {}

const Textarea = React.forwardRef<TextInput, TextareaProps>(
  ({ style, ...props }, ref) => (
    <TextInput
      ref={ref}
      style={[styles.textarea, style]}
      placeholderTextColor="#9ca3af"
      multiline
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  textarea: {
    minHeight: 80,
    width: '100%',
    borderRadius: 6,
    borderColor: '#d1d5db',
    borderWidth: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#000',
    textAlignVertical: 'top',
  },
});

export { Textarea };
