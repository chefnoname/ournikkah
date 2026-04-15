import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const PHRASES = [
  'Plan My Nikah',
  'Find a Venue',
  'Find Halal Catering',
  'Create an Invitation',
  'Write My Mahr',
  'Find an Officiant',
  'Have My Perfect Nikah',
];

export default function AITab() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(p => (p + 1) % PHRASES.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="ellipsis-horizontal" size={24} color={Colors.gold} />
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
              <Text style={styles.aiBadgeText}>MyNikkah AI</Text>
            </View>
          </View>

          <View style={styles.textSection}>
            <Text style={styles.helpMe}>Help Me</Text>
            <Text style={styles.phrase}>{PHRASES[index]}</Text>
          </View>

          <TouchableOpacity style={styles.comingSoonBtn} disabled>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footerText}>
          Your personal Nikah planning assistant. Coming soon.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.rose },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, gap: Spacing.lg },
  card: {
    width: '100%', maxWidth: 400,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 32,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 30, elevation: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 48 },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 6,
  },
  aiBadgeText: { fontSize: 13, fontFamily: FontFamily.sansMedium, color: Colors.gold },
  textSection: { marginBottom: 32, minHeight: 96 },
  helpMe: { fontSize: FontSize.xxl, fontFamily: FontFamily.sansLight, color: Colors.text, letterSpacing: -0.5 },
  phrase: { fontSize: FontSize.xxl, fontFamily: FontFamily.serifBold, color: Colors.gold, letterSpacing: -0.5, marginTop: 4 },
  comingSoonBtn: {
    width: '100%', height: 56, borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', opacity: 0.9,
  },
  comingSoonText: { fontSize: FontSize.base, fontFamily: FontFamily.sansMedium, color: '#fff' },
  footerText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.textSecondary, textAlign: 'center' },
});
