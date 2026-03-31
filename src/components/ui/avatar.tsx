import React from 'react';
import {
    Image,
    ImageStyle,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';

interface AvatarProps {
  source?: { uri: string };
  initials?: string;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

interface AvatarImageProps {
  source: { uri: string };
  style?: ImageStyle;
}

interface AvatarFallbackProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

const Avatar = React.forwardRef<View, AvatarProps>(
  (
    { source, initials, size = 'md', style },
    ref
  ) => {
    const sizeStyles = {
      sm: styles.avatar__sm,
      md: styles.avatar__md,
      lg: styles.avatar__lg,
    };

    return (
      <View
        ref={ref}
        style={[styles.avatar, sizeStyles[size], style]}
      >
        {source ? (
          <Image
            source={source}
            style={[styles.image, sizeStyles[size]]}
          />
        ) : (
          <Text style={[styles.fallback, styles[`fallback__${size}`]]}>
            {initials}
          </Text>
        )}
      </View>
    );
  }
);

Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<Image, AvatarImageProps>(
  ({ source, style }, ref) => (
    <Image
      ref={ref}
      source={source}
      style={[styles.image, style]}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<View, AvatarFallbackProps>(
  ({ children, style }, ref) => (
    <View ref={ref} style={[styles.fallbackContainer, style]}>
      <Text style={styles.fallback}>{children}</Text>
    </View>
  )
);
AvatarFallback.displayName = 'AvatarFallback';

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar__sm: {
    width: 32,
    height: 32,
  },
  avatar__md: {
    width: 40,
    height: 40,
  },
  avatar__lg: {
    width: 56,
    height: 56,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallback: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  [`fallback__sm`]: {
    fontSize: 12,
  },
  [`fallback__md`]: {
    fontSize: 14,
  },
  [`fallback__lg`]: {
    fontSize: 16,
  },
});

export { Avatar, AvatarFallback, AvatarImage };

