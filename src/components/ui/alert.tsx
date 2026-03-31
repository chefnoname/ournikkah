import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

type AlertVariant = 'default' | 'destructive';

interface AlertProps {
  variant?: AlertVariant;
  children?: React.ReactNode;
  style?: ViewStyle;
}

interface AlertTitleProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

interface AlertDescriptionProps {
  children?: React.ReactNode;
  style?: TextStyle;
}

const Alert = React.forwardRef<View, AlertProps>(
  ({ variant = 'default', children, style }, ref) => (
    <View
      ref={ref}
      style={[styles.alert, styles[`alert__${variant}`], style]}
      role="alert"
    >
      {children}
    </View>
  )
);
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<Text, AlertTitleProps>(
  ({ children, style }, ref) => (
    <Text ref={ref} style={[styles.title, style]}>
      {children}
    </Text>
  )
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<Text, AlertDescriptionProps>(
  ({ children, style }, ref) => (
    <Text ref={ref} style={[styles.description, style]}>
      {children}
    </Text>
  )
);
AlertDescription.displayName = 'AlertDescription';

const styles = StyleSheet.create({
  alert: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  alert__default: {
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
  },
  alert__destructive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 24,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6b7280',
  },
});

export { Alert, AlertDescription, AlertTitle };

