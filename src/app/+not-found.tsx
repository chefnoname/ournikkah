import { ScreenWrapper } from '@/components/ScreenWrapper';
import { Colors, FontSize, Spacing } from '@/constants/theme';
import { Link } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

export default function NotFoundScreen() {
  return (
    <ScreenWrapper scrollable={false} style={styles.center}>
      <Text style={styles.title}>Page Not Found</Text>
      <Link href="/" style={styles.link}>
        Go back home
      </Link>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  link: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
