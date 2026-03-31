import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  style?: ViewStyle;
}

const Skeleton = React.forwardRef<View, SkeletonProps>(
  ({ style }, ref) => {
    const shimmerValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }, [shimmerValue]);

    const opacity = shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0.8],
    });

    return (
      <Animated.View
        ref={ref}
        style={[
          styles.skeleton,
          style,
          {
            opacity,
          },
        ]}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#e5e7eb',
    borderRadius: 6,
  },
});

export { Skeleton };
