import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { getGuestToken } from '@/lib/fetchWithAuth';
import { getSavedWorkspaceId, useWorkspace } from '@/lib/useWorkspace';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  const router = useRouter();
  const { startGuestSession, setWorkspaceId } = useWorkspace();
  const [isStarting, setIsStarting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (__DEV__) {
        await AsyncStorage.clear();
      }
      const token = await getGuestToken();
      const wsId = await getSavedWorkspaceId();
      if (token && wsId) {
        await setWorkspaceId(wsId);
        router.replace('/(tabs)/home');
      }
      setChecking(false);
    })();
  }, []);

  const handleStartPlanning = async () => {
    setIsStarting(true);
    setStartError(null);
    try {
      await startGuestSession();
      router.replace('/onboarding');
    } catch (e) {
      if (e instanceof TypeError) {
        setStartError('Could not connect to the server. Please check your connection and try again.');
      } else {
        setStartError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      }
      console.error('Failed to start planning:', e);
    } finally {
      setIsStarting(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/auth')}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.heartIcon}>♥</Text>
        </View>

        <Text style={styles.title}>MyNikkah</Text>
        <Text style={styles.title}>OurNikkah</Text>
        <Text style={styles.subtitle}>Plan your perfect wedding journey together</Text>

        <TouchableOpacity
          style={[styles.startButton, isStarting && styles.buttonDisabled]}
          onPress={handleStartPlanning}
          disabled={isStarting}
          activeOpacity={0.8}
        >
          {isStarting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.startButtonText}>Start Planning</Text>
          )}
        </TouchableOpacity>

        {startError ? (
          <Text style={styles.errorText}>{startError}</Text>
        ) : null}
        <Text style={styles.noAccountText}>No account required to get started</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Made with love for Muslim couples</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    alignItems: 'flex-end',
  },
  signInText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansMedium,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heartIcon: {
    fontSize: 36,
    color: Colors.gold,
  },
  title: {
    fontSize: FontSize.hero,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  startButton: {
    width: '100%',
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  startButtonText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error ?? '#E53E3E',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  noAccountText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  footer: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
});
