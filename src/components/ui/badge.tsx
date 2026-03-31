import React from 'react';
import {
    StyleSheet,
    Text,
    TextStyle,
    View,
    ViewStyle,
} from 'react-native';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ variant = 'default', children, style, textStyle }, ref) => (
    <View ref={ref} style={[styles.badge, styles[`badge__${variant}`], style]}>
      <Text style={[styles.text, styles[`text__${variant}`], textStyle]}>
        {children}
      </Text>
    </View>
  )
);

Badge.displayName = 'Badge';

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badge__default: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  badge__secondary: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  badge__destructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  badge__outline: {
    backgroundColor: 'transparent',
    borderColor: '#ccc',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  text__default: {
    color: '#fff',
  },
  text__secondary: {
    color: '#000',
  },
  text__destructive: {
    color: '#fff',
  },
  text__outline: {
    color: '#000',
  },
});

export { Badge };
