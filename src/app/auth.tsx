import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      if (activeTab === 'login') {
        await login(email, password);
      } else {
        await register(email, password);
      }
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.title}>My Nikkah</Text>
            <Text style={styles.subtitle}>Your wedding journey</Text>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Welcome</Text>
              <Text style={styles.cardDesc}>Sign in to access your planner</Text>

              <View style={styles.tabRow}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'login' && styles.tabActive]}
                  onPress={() => { setActiveTab('login'); setError(''); }}
                >
                  <Text style={[styles.tabText, activeTab === 'login' && styles.tabTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'register' && styles.tabActive]}
                  onPress={() => { setActiveTab('register'); setError(''); }}
                >
                  <Text style={[styles.tabText, activeTab === 'register' && styles.tabTextActive]}>Register</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {activeTab === 'login' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
  },
  cardDesc: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.textSecondary },
  tabTextActive: { color: Colors.text },
  form: { gap: Spacing.sm },
  label: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansMedium,
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  input: {
    height: 48,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(26,26,26,0.1)',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md,
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.text,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.error,
    marginTop: Spacing.xs,
  },
  submitButton: {
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  buttonDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold },
});
