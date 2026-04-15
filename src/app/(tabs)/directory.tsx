import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { SavedVendor, VendorItem } from '@/lib/types';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert, FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const VENUE_SUBS = [
  { value: 'all', label: 'All Venues' },
  { value: 'hotel', label: 'Hotels' },
  { value: 'hall', label: 'Halls' },
  { value: 'mosque', label: 'Mosques' },
];
const VENDOR_SUBS = [
  { value: 'all', label: 'All Vendors' },
  { value: 'photographer', label: 'Photographers' },
  { value: 'caterer', label: 'Caterers' },
  { value: 'decorator', label: 'Decorators' },
  { value: 'mua', label: 'MUA' },
];

export default function DirectoryTab() {
  const { workspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState<'venue' | 'vendor'>('venue');
  const [subCategory, setSubCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<VendorItem[]>([]);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<VendorItem | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDirectory = useCallback(async () => {
    try {
      // Seed directory first
      await fetchWithAuth(toAbsoluteUrl(api.directory.seed.path), { method: 'POST' }).catch(() => {});
      const res = await fetchWithAuth(toAbsoluteUrl(api.directory.list.path));
      if (res.ok) setItems(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  const fetchSaved = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.savedVendors.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const data: SavedVendor[] = await res.json();
        setSavedIds(new Set(data.map(sv => sv.vendorItemId)));
      }
    } catch (e) { console.error(e); }
  }, [workspaceId]);

  useEffect(() => { fetchDirectory(); fetchSaved(); }, []); // react-hooks/exhaustive-deps

  const handleSave = async (vendorItemId: number) => {
    if (!workspaceId) return;
    setSaving(true);
    try {
      const url = toAbsoluteUrl(buildUrl(api.savedVendors.save.path, { id: workspaceId }));
      const res = await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorItemId }),
      });
      if (res.ok) {
        setSavedIds(prev => new Set([...prev, vendorItemId]));
        Alert.alert('Added to Hub', 'Vendor saved to your hub.');
      }
    } catch { Alert.alert('Error', 'Could not save. Try again.'); }
    setSaving(false);
  };

  const subcats = activeTab === 'venue' ? VENUE_SUBS : VENDOR_SUBS;

  const filtered = useMemo(() => {
    return items.filter(item => {
      if (item.section !== activeTab) return false;
      if (subCategory !== 'all' && item.vendorCategory !== subCategory) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!item.title.toLowerCase().includes(q) && !item.location?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [items, activeTab, subCategory, searchQuery]);

  const handleTabChange = (tab: 'venue' | 'vendor') => {
    setActiveTab(tab);
    setSubCategory('all');
    setSearchQuery('');
  };

  const renderItem = ({ item }: { item: VendorItem }) => (
    <TouchableOpacity style={styles.itemCard} onPress={() => setSelectedItem(item)} activeOpacity={0.8}>
      {item.section === 'venue' && (
        <View style={styles.venueImagePlaceholder}>
          <Ionicons name="business" size={32} color={Colors.gold} />
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
          <TouchableOpacity
            style={styles.saveIconBtn}
            onPress={() => handleSave(item.id)}
          >
            <Ionicons
              name={savedIds.has(item.id) ? 'star' : 'star-outline'}
              size={14}
              color={savedIds.has(item.id) ? Colors.gold : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.itemContent}>
        {item.section === 'vendor' && (
          <View style={styles.vendorTopRow}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.gold} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
            <TouchableOpacity onPress={() => handleSave(item.id)}>
              <Ionicons
                name={savedIds.has(item.id) ? 'star' : 'star-outline'}
                size={14}
                color={savedIds.has(item.id) ? Colors.gold : Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.itemTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {item.location && (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.locationText} numberOfLines={1}>{item.location}</Text>
              </View>
            )}
          </View>
          {item.priceRange && <Text style={styles.priceText}>{item.priceRange}</Text>}
        </View>
        <View style={styles.badgeRow}>
          {item.sisterFriendly && <View style={styles.featureBadge}><Text style={styles.featureBadgeText}>Sister Friendly</Text></View>}
          {item.parking && <View style={styles.featureBadge}><Text style={styles.featureBadgeText}>Parking</Text></View>}
          {item.disabilityAccessible && <View style={styles.featureBadge}><Text style={styles.featureBadgeText}>Accessible</Text></View>}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerSection}>
        <Text style={styles.pageTitle}>Vendors & Venues</Text>
        <Text style={styles.pageSubtitle}>Browse trusted professionals for your special day</Text>

        {/* Main tabs */}
        <View style={styles.tabRow}>
          {(['venue', 'vendor'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => handleTabChange(tab)}
            >
              <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
                {tab === 'venue' ? 'Venues' : 'Vendors'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Subcategory tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subTabScroll}>
          {subcats.map(cat => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.subTab, subCategory === cat.value && styles.subTabActive]}
              onPress={() => setSubCategory(cat.value)}
            >
              <Text style={[styles.subTabText, subCategory === cat.value && styles.subTabTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={16} color={Colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or name..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Colors.gold} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No items found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your filters or search query.</Text>
            </View>
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet">
        {selectedItem && (
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              <TouchableOpacity style={styles.modalBackBtn} onPress={() => setSelectedItem(null)}>
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
              </TouchableOpacity>

              {selectedItem.section === 'venue' ? (
                <View style={styles.modalImagePlaceholder}>
                  <Ionicons name="business" size={48} color={Colors.gold} />
                </View>
              ) : (
                <View style={styles.modalAvatarWrap}>
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>{selectedItem.title.charAt(0)}</Text>
                  </View>
                </View>
              )}

              <View style={styles.modalBody}>
                <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                <View style={styles.modalMetaRow}>
                  {selectedItem.vendorCategory && (
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>
                        {selectedItem.vendorCategory === 'mua' ? 'MUA' : selectedItem.vendorCategory.charAt(0).toUpperCase() + selectedItem.vendorCategory.slice(1)}
                      </Text>
                    </View>
                  )}
                  {selectedItem.priceRange && (
                    <View style={styles.priceBadge}><Text style={styles.priceBadgeText}>{selectedItem.priceRange}</Text></View>
                  )}
                  {selectedItem.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.locationText}>{selectedItem.location}</Text>
                    </View>
                  )}
                </View>

                {selectedItem.bio && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>ABOUT</Text>
                    <Text style={styles.sectionText}>{selectedItem.bio}</Text>
                  </View>
                )}

                {selectedItem.capacity && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Ionicons name="people" size={16} color={Colors.gold} />
                    <Text style={styles.sectionText}>Capacity: {selectedItem.capacity}</Text>
                  </View>
                )}

                {selectedItem.contactEmail && (
                  <View style={styles.modalSection}>
                    <Text style={styles.sectionLabel}>CONTACT</Text>
                    <View style={styles.contactRow}>
                      <Ionicons name="mail" size={16} color={Colors.gold} />
                      <Text style={styles.contactText}>{selectedItem.contactEmail}</Text>
                    </View>
                    {selectedItem.contactPhone && (
                      <View style={styles.contactRow}>
                        <Ionicons name="call" size={16} color={Colors.gold} />
                        <Text style={styles.contactText}>{selectedItem.contactPhone}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveToHubBtn, savedIds.has(selectedItem.id) && styles.saveToHubBtnDisabled]}
                onPress={() => handleSave(selectedItem.id)}
                disabled={savedIds.has(selectedItem.id) || saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name={savedIds.has(selectedItem.id) ? 'checkmark' : 'add'} size={18} color="#fff" />
                    <Text style={styles.saveToHubText}>{savedIds.has(selectedItem.id) ? 'Already in Hub' : 'Save to Hub'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, gap: Spacing.sm },
  pageTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  tabRow: { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm },
  tabBtn: { borderRadius: BorderRadius.full, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.surface },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabBtnText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.textSecondary },
  tabBtnTextActive: { color: '#fff' },
  subTabScroll: { marginTop: 4 },
  subTab: { borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 6, backgroundColor: Colors.surface, marginRight: 8 },
  subTabActive: { backgroundColor: Colors.primary },
  subTabText: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.textSecondary },
  subTabTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', marginTop: 4 },
  searchIcon: { marginLeft: 16 },
  searchInput: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.text },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.md },
  itemCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, overflow: 'hidden' },
  venueImagePlaceholder: { height: 144, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  verifiedBadge: { position: 'absolute', top: 12, left: 12, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: BorderRadius.full, paddingHorizontal: 10, paddingVertical: 4 },
  verifiedText: { fontSize: 10, fontWeight: '500', color: Colors.gold },
  saveIconBtn: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: BorderRadius.full, padding: 6 },
  vendorTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemContent: { padding: 20, gap: 12 },
  itemTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  itemTitle: { fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  locationText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  priceText: { fontSize: FontSize.md, fontFamily: FontFamily.sansSemiBold, color: Colors.gold },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  featureBadge: { borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', paddingHorizontal: 12, paddingVertical: 6 },
  featureBadgeText: { fontSize: FontSize.xs, fontWeight: '500', color: Colors.text },
  emptyState: { alignItems: 'center', paddingVertical: 64, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl },
  emptyTitle: { fontSize: FontSize.lg, fontFamily: FontFamily.sansMedium, color: Colors.text },
  emptyDesc: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, marginTop: 4 },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.surface },
  modalScroll: { paddingBottom: 100 },
  modalBackBtn: { padding: 16 },
  modalImagePlaceholder: { height: 220, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  modalAvatarWrap: { alignItems: 'center', paddingTop: 24 },
  modalAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
  modalAvatarText: { color: '#fff', fontSize: 40, fontFamily: FontFamily.serifBold },
  modalBody: { padding: Spacing.lg },
  modalTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  modalMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  catBadge: { borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeText: { fontSize: 11, fontWeight: '500', color: Colors.gold },
  priceBadge: { borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', paddingHorizontal: 12, paddingVertical: 4 },
  priceBadgeText: { fontSize: 11, fontWeight: '500', color: Colors.text },
  modalSection: { marginTop: 24 },
  sectionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.sansSemiBold, color: Colors.gold, letterSpacing: 1, marginBottom: 8 },
  sectionText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, lineHeight: 22 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginTop: 8 },
  contactText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.text },
  modalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.surface },
  saveToHubBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  saveToHubBtnDisabled: { opacity: 0.5 },
  saveToHubText: { fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold, color: '#fff' },
});
