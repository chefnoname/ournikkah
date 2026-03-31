import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button = React.forwardRef<TouchableOpacity, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'default',
      disabled = false,
      loading = false,
      onPress,
      children,
      style,
      textStyle,
    },
    ref
  ) => {
    const buttonStyle = [
      styles.button,
      styles[`button__${variant}`],
      styles[`button__${size}`],
      disabled && styles.disabled,
      style,
    ];

    const text =
      typeof children === 'string' ? (
        <Text style={[styles.text, styles[`text__${variant}`], textStyle]}>
          {children}
        </Text>
      ) : (
        children
      );

    return (
      <TouchableOpacity
        ref={ref}
        style={buttonStyle}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          text
        )}
      </TouchableOpacity>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  button__default: {
    backgroundColor: '#000',
    borderColor: '#000',
    borderWidth: 1,
  },
  button__destructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  button__outline: {
    backgroundColor: 'transparent',
    borderColor: '#ccc',
    borderWidth: 1,
  },
  button__secondary: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
  },
  button__ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 1,
  },
  button__sm: {
    minHeight: 32,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  button__lg: {
    minHeight: 40,
    paddingHorizontal: 32,
  },
  button__icon: {
    width: 36,
    height: 36,
    paddingHorizontal: 0,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  text__default: {
    color: '#fff',
  },
  text__destructive: {
    color: '#fff',
  },
  text__outline: {
    color: '#000',
  },
  text__secondary: {
    color: '#000',
  },
  text__ghost: {
    color: '#000',
  },
  disabled: {
    opacity: 0.5,
  },
});

export { Button };
