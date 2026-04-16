import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import type { VendorItem } from '@/lib/types';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator, Modal, RefreshControl,
    ScrollView,
    StyleSheet,
    Text, TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SummaryTab() {
  const router = useRouter();
  const { workspace, workspaceId, summary, fetchWorkspace, fetchSummary } = useWorkspace();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<VendorItem | null>(null);

  useFocusEffect(useCallback(() => {
    if (workspaceId) { fetchWorkspace(); fetchSummary(); }
  }, [workspaceId]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchWorkspace(), fetchSummary()]);
    setRefreshing(false);
  }, [fetchWorkspace, fetchSummary]);

  const loading = !workspace && !summary;
  if (loading) {
    return (
      <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
        <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator size="large" color={Colors.gold} /></View></SafeAreaView>
      </LinearGradient>
    );
  }

  const totalBudget = summary?.totalBudget || 0;
  const budgetSpent = summary?.budgetSpent || 0;
  const budgetRemaining = totalBudget - budgetSpent;
  const budgetPercent = totalBudget > 0 ? Math.min((budgetSpent / totalBudget) * 100, 100) : 0;
  const countdown = summary?.nikahCountdownDays;

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
        >
        <Text style={styles.title}>Summary</Text>
        <Text style={styles.subtitle}>No thinking. Just clarity.</Text>

        {/* Countdown */}
        {workspace?.hasNikah && countdown != null && (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionLabel}>WEDDING COUNTDOWN</Text>
            <View style={styles.countdownCard}>
              <Text style={styles.countdownDays}>{Math.abs(countdown)}</Text>
              <Text style={styles.countdownCaption}>
                {countdown >= 0 ? 'days until your Nikah' : 'days since your Nikah'}
              </Text>
              {summary?.nikahDisplay && (
                <Text style={styles.countdownDate}>{summary.nikahDisplay}</Text>
              )}
            </View>
          </View>
        )}

        {/* Finalized Venues */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionLabel}>FINALIZED CHOICES</Text>
          <Text style={styles.subSectionLabel}>Venue</Text>
          {summary?.finalizedVenues && summary.finalizedVenues.length > 0 ? (
            summary.finalizedVenues.map(v => (
              <TouchableOpacity key={v.id} style={styles.finalizedCard} onPress={() => setSelectedVendor(v)} activeOpacity={0.8}>
                <View style={styles.finalizedImagePlaceholder}>
                  <Ionicons name="business" size={32} color={Colors.gold} />
                </View>
                <View style={styles.finalizedContent}>
                  <Text style={styles.finalizedTitle}>{v.title}</Text>
                  {v.location && (
                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={12} color={Colors.textSecondary} />
                      <Text style={styles.locText}>{v.location}</Text>
                    </View>
                  )}
                  {v.priceRange && (
                    <View style={styles.pricePill}><Text style={styles.pricePillText}>{v.priceRange}</Text></View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Mark a venue as "Booked" in the Hub to see it here</Text>
            </View>
          )}

          <Text style={[styles.subSectionLabel, { marginTop: 24 }]}>Vendors</Text>
          {summary?.finalizedVendors && summary.finalizedVendors.length > 0 ? (
            <View style={styles.vendorListCard}>
              {summary.finalizedVendors.map((v, i) => (
                <TouchableOpacity key={v.id} onPress={() => setSelectedVendor(v)} activeOpacity={0.8}>
                  <View style={styles.vendorRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vendorTitle}>{v.title}</Text>
                      <View style={styles.locRow}>
                        {v.location && <><Ionicons name="location-outline" size={12} color={Colors.textSecondary} /><Text style={styles.locText}>{v.location}</Text></>}
                      </View>
                    </View>
                    {v.vendorCategory && (
                      <View style={styles.catBadge}><Text style={styles.catBadgeText}>{v.vendorCategory}</Text></View>
                    )}
                  </View>
                  {i < (summary.finalizedVendors?.length || 0) - 1 && <View style={styles.divider} />}
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Mark a vendor as "Booked" in the Hub to see it here</Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push({ pathname: '/(tabs)/hub', params: { tab: 'invites' } })} activeOpacity={0.8}>
            <Text style={styles.sectionLabel}>GUESTS</Text>
            <View style={styles.statCardInner}>
              <Text style={styles.statBig}>{summary?.guestCount || '—'}</Text>
              <Text style={styles.statSmallLabel}>Expected</Text>
              <View style={styles.divider} />
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={[styles.statMed, { color: Colors.gold }]}>{summary?.guestAttending ?? 0}</Text>
                  <Text style={styles.statTinyLabel}>Attending</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statMed, { color: Colors.textSecondary }]}>{summary?.guestPending ?? 0}</Text>
                  <Text style={styles.statTinyLabel}>Pending</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statCard} onPress={() => router.push({ pathname: '/(tabs)/hub', params: { tab: 'budget' } })} activeOpacity={0.8}>
            <Text style={styles.sectionLabel}>BUDGET</Text>
            <View style={styles.statCardInner}>
              <Text style={styles.statBig}>{totalBudget > 0 ? `£${(totalBudget / 1000).toFixed(0)}k` : '—'}</Text>
              <Text style={styles.statSmallLabel}>Total</Text>
              {totalBudget > 0 && (
                <>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${budgetPercent}%` }]} />
                  </View>
                  <View style={styles.budgetLabels}>
                    <Text style={styles.statTinyLabel}>£{budgetSpent.toLocaleString()}</Text>
                    <Text style={styles.statTinyLabel}>£{budgetRemaining.toLocaleString()}</Text>
                  </View>
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Vendor/Venue Detail Modal */}
      <Modal visible={!!selectedVendor} animationType="slide" presentationStyle="pageSheet">
        {selectedVendor && (
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={styles.modalBackBtn} onPress={() => setSelectedVendor(null)}>
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
              </TouchableOpacity>

              {selectedVendor.section === 'venue' ? (
                <View style={styles.modalImagePlaceholder}>
                  <Ionicons name="business" size={48} color={Colors.gold} />
                </View>
              ) : (
                <View style={styles.modalAvatarWrap}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{selectedVendor.title.charAt(0)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedVendor.title}</Text>
                <View style={styles.modalMetaRow}>
                  {selectedVendor.vendorCategory && (
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>
                        {selectedVendor.vendorCategory === 'mua' ? 'MUA' : selectedVendor.vendorCategory.charAt(0).toUpperCase() + selectedVendor.vendorCategory.slice(1)}
                      </Text>
                    </View>
                  )}
                  {selectedVendor.priceRange && (
                    <View style={styles.pricePill}><Text style={styles.pricePillText}>{selectedVendor.priceRange}</Text></View>
                  )}
                  {selectedVendor.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.locText}>{selectedVendor.location}</Text>
                    </View>
                  )}
                </View>

                {selectedVendor.bio && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>ABOUT</Text>
                    <Text style={styles.modalSectionText}>{selectedVendor.bio}</Text>
                  </View>
                )}

                {selectedVendor.capacity && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Ionicons name="people" size={16} color={Colors.gold} />
                    <Text style={styles.modalSectionText}>Capacity: {selectedVendor.capacity}</Text>
                  </View>
                )}

                {selectedVendor.contactEmail && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionLabel}>CONTACT</Text>
                    <View style={styles.modalContactRow}>
                      <Ionicons name="mail" size={16} color={Colors.gold} />
                      <Text style={styles.modalContactText}>{selectedVendor.contactEmail}</Text>
                    </View>
                    {selectedVendor.contactPhone && (
                      <View style={styles.modalContactRow}>
                        <Ionicons name="call" size={16} color={Colors.gold} />
                        <Text style={styles.modalContactText}>{selectedVendor.contactPhone}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  title: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: FontSize.base, fontStyle: 'italic', color: Colors.textSecondary },
  sectionWrap: { marginTop: 16 },
  sectionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.sansSemiBold, color: Colors.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 },
  subSectionLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.gold, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, paddingHorizontal: 4 },
  countdownCard: {
    borderRadius: BorderRadius.xl, padding: 32, alignItems: 'center',
    backgroundColor: Colors.goldLight, borderWidth: 1, borderColor: 'rgba(201,169,110,0.2)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12,
  },
  countdownDays: { fontSize: 80, fontFamily: FontFamily.serifBold, color: Colors.gold, lineHeight: 80 },
  countdownCaption: { fontSize: FontSize.md, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 8 },
  countdownDate: { fontSize: FontSize.xs, color: 'rgba(107,107,107,0.7)', marginTop: 4 },
  finalizedCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, marginBottom: 12,
  },
  finalizedImagePlaceholder: { height: 160, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  finalizedContent: { padding: 20 },
  finalizedTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: FontSize.md, color: Colors.textSecondary },
  pricePill: { borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 4, alignSelf: 'flex-start', marginTop: 8 },
  pricePillText: { fontSize: 11, fontWeight: '500', color: Colors.gold },
  vendorListCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  vendorRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 20, gap: 8 },
  vendorTitle: { fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  catBadge: { borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeText: { fontSize: 10, fontWeight: '500', color: Colors.gold },
  divider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 20 },
  emptyCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', gap: 16, marginTop: 16 },
  statCard: { flex: 1 },
  statCardInner: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, gap: 8 },
  statBig: { fontSize: FontSize.hero, fontFamily: FontFamily.serifBold, color: Colors.text, textAlign: 'center' },
  statSmallLabel: { fontSize: 10, fontWeight: '500', color: Colors.textSecondary, textAlign: 'center' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', gap: 8 },
  statItem: { alignItems: 'center' },
  statMed: { fontSize: FontSize.lg, fontFamily: FontFamily.serifBold },
  statTinyLabel: { fontSize: 10, fontWeight: '500', color: Colors.textSecondary },
  progressBar: { height: 6, backgroundColor: Colors.background, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: Colors.gold, borderRadius: 3 },
  budgetLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  // Detail Modal
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalScroll: { paddingBottom: 40 },
  modalBackBtn: { padding: 16 },
  modalImagePlaceholder: { height: 220, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  modalAvatarWrap: { alignItems: 'center', paddingTop: 24 },
  modalAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { color: '#fff', fontSize: 40, fontFamily: FontFamily.serifBold },
  modalBody: { padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  modalMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  modalSection: { marginTop: 24 },
  modalSectionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.sansSemiBold, color: Colors.gold, letterSpacing: 1, marginBottom: 8 },
  modalSectionText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, lineHeight: 22 },
  modalContactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginTop: 8 },
  modalContactText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.text },
});
