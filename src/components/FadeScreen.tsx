import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function FadeScreen({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      opacity.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [])
  );

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
