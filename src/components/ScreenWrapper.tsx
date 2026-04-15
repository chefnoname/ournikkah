import { GradientConfig, Spacing } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, type ViewStyle } from 'react-native';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scrollable?: boolean;
  style?: ViewStyle;
}

export function ScreenWrapper({ children, scrollable = true, style }: ScreenWrapperProps) {
  const content = scrollable ? (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    children
  );

  return (
    <LinearGradient {...GradientConfig} style={styles.gradient}>
      <SafeAreaView style={[styles.container, style]}>
        {content}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
});
