import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, RefreshControl,
  ScrollView,
  StyleSheet,
  Text, TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const QUICK_ACTIONS = [
  { label: 'Venues', icon: 'business-outline' as const, tab: 'directory' },
  { label: 'Catering', icon: 'restaurant-outline' as const, tab: 'directory' },
  { label: 'Florists', icon: 'flower-outline' as const, tab: 'directory' },
  { label: 'Invites', icon: 'mail-outline' as const, tab: 'hub' },
  { label: 'Budget', icon: 'wallet-outline' as const, tab: 'hub' },
  { label: 'Notes', icon: 'book-outline' as const, tab: 'hub' },
];

function ThinkingDots() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive(p => (p + 1) % 3), 400);
    return () => clearInterval(t);
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 20 }}>
      {[0, 1, 2].map(i => (
        <View
          key={i}
          style={{
            width: 7, height: 7, borderRadius: 4,
            backgroundColor: active === i ? Colors.text : '#D1D5DB',
            transform: [{ translateY: active === i ? -4 : 0 }, { scale: active === i ? 1.2 : 1 }],
          }}
        />
      ))}
    </View>
  );
}

export default function HomeTab() {
  const router = useRouter();
  const { workspace, workspaceId, summary, members, fetchWorkspace, fetchSummary, fetchMembers, isLoading } = useWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      fetchWorkspace();
      fetchSummary();
      fetchMembers();
    }
  }, [workspaceId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkspace(), fetchSummary(), fetchMembers()]);
    setRefreshing(false);
  }, [fetchWorkspace, fetchSummary, fetchMembers]);

  const handleInvite = async () => {
    if (!workspaceId) return;
    setInviting(true);
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.invite.path, { id: workspaceId }));
      const res = await fetchWithAuth(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const inviteUrl = data.inviteUrl || `Invite code: ${data.inviteCode}`;
      const msg = `Join my Our Nikkah planning space 💍\n\n${inviteUrl}`;
      await Clipboard.setStringAsync(msg);
      Alert.alert('Link copied!', 'Share it with whoever you\'d like to plan with.');
    } catch {
      Alert.alert('Error', 'Couldn\'t generate invite. Please try again.');
    } finally {
      setInviting(false);
    }
  };

  if (isLoading && !workspace) {
    return (
      <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={Colors.gold} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const name = workspace?.userName || workspace?.name;
  const countdown = summary?.nikahCountdownDays ?? null;
  const collaborators = members.filter(m => m.role === 'collaborator');

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLogo}>MyNikkah</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.split('')[0].toUpperCase()}</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.greeting}>Assalamu Alaykum, {name}</Text>
          {countdown !== null && (
            <Text style={styles.countdownSubtitle}>Your Nikah is in {countdown} days</Text>
          )}
          {countdown !== null && (
            <View style={styles.countdownPill}>
              <Text style={styles.countdownPillText}>Countdown: {countdown} Days</Text>
            </View>
          )}
        </View>

        {/* Our Nikkah Card */}
        <View style={styles.card}>
          <View style={styles.ourNikkahRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Our Nikkah</Text>
              <Text style={styles.cardDesc}>Invite your partner, friend or relative to plan together</Text>
            </View>
            {collaborators.length > 0 ? (
              <View style={{ alignItems: 'center' }}>
                <View style={{ flexDirection: 'row' }}>
                  {collaborators.slice(0, 3).map(m => (
                    <View key={m.id} style={styles.collabAvatar}>
                      <Text style={styles.collabAvatarText}>
                        {(m.user?.username || m.user?.email || '?').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.collabCount}>{collaborators.length} planning</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite} disabled={inviting}>
                {inviting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={14} color="#fff" />
                    <Text style={styles.inviteBtnText}>Invite</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(`/(tabs)/${action.tab}` as any)}
              activeOpacity={0.7}
            >
              <Ionicons name={action.icon} size={24} color={Colors.text} />
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Preview Card */}
        <TouchableOpacity style={styles.aiCard} onPress={() => router.push('/(tabs)/ai')} activeOpacity={0.8}>
          <View style={styles.aiHeader}>
            <ThinkingDots />
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
              <Text style={styles.aiBadgeText}>MyNikkah AI</Text>
            </View>
          </View>
          <View style={{ marginTop: 24 }}>
            <Text style={styles.aiTitle}>
              <Text style={{ fontFamily: FontFamily.sansLight }}>Help Me{'\n'}</Text>
              <Text style={{ fontFamily: FontFamily.serifBold, color: Colors.gold }}>Plan My Nikah</Text>
            </Text>
          </View>
          <View style={styles.comingSoonPill}>
            <Text style={styles.comingSoonText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.xs },
  headerLogo: { fontSize: FontSize.xl, fontFamily: FontFamily.serifBold, color: Colors.text, letterSpacing: -0.5 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontFamily: FontFamily.serifBold, color: Colors.gold, fontSize: FontSize.lg },
  heroCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.lg,
    backgroundColor: Colors.rose,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
  },
  greeting: { fontSize: FontSize.xxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  countdownSubtitle: { fontSize: FontSize.base, fontFamily: FontFamily.sans, color: Colors.textSecondary, marginTop: 4 },
  countdownPill: {
    alignSelf: 'flex-start', borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold, paddingHorizontal: 16, paddingVertical: 8, marginTop: Spacing.md,
  },
  countdownPillText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: '#fff' },
  card: {
    borderRadius: BorderRadius.xl, backgroundColor: Colors.surface, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
  },
  ourNikkahRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  cardDesc: { fontSize: FontSize.xs, fontFamily: FontFamily.sans, color: Colors.textSecondary, marginTop: 4, maxWidth: 200 },
  collabAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.gold,
    borderWidth: 2, borderColor: Colors.surface, justifyContent: 'center', alignItems: 'center', marginLeft: -8,
  },
  collabAvatarText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  collabCount: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 4 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.gold,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  inviteBtnText: { fontSize: FontSize.xs, fontFamily: FontFamily.sansMedium, color: '#fff' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: {
    width: '30%', flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: BorderRadius.lg, backgroundColor: Colors.surface, paddingVertical: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 8,
  },
  actionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.sansMedium, color: Colors.text },
  aiCard: {
    borderRadius: BorderRadius.xl, backgroundColor: Colors.surface, padding: Spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, overflow: 'hidden',
  },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 6,
  },
  aiBadgeText: { fontSize: 13, fontFamily: FontFamily.sansMedium, color: Colors.gold },
  aiTitle: { fontSize: FontSize.xxl, fontFamily: FontFamily.serifBold, color: Colors.text, lineHeight: 34 },
  comingSoonPill: {
    alignSelf: 'flex-start', borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, marginTop: 24, opacity: 0.9,
  },
  comingSoonText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: '#fff' },
});
