import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { BudgetItem, GuestInvite, SavedVendor } from '@/lib/types';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SavedVendorWithItem = SavedVendor & { vendorItem?: any };

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved', bg: '#F3F4F6', fg: '#6B6B6B' },
  { value: 'contacted', label: 'Contacted', bg: Colors.goldLight, fg: Colors.gold },
  { value: 'awaiting_reply', label: 'Awaiting Reply', bg: Colors.goldLight, fg: Colors.gold },
  { value: 'met_visited', label: 'Met / Visited', bg: '#E8F4F0', fg: '#4A9B7F' },
  { value: 'booked', label: 'Booked ✓', bg: Colors.primary, fg: '#fff' },
];

const BUDGET_CATEGORIES = ['Venue', 'Catering', 'Officiant', 'Invitations', 'Attire', 'Other'];

// --- Saved Tab ---
function SavedTab({ workspaceId }: { workspaceId: number }) {
  const [vendors, setVendors] = useState<SavedVendorWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<SavedVendorWithItem | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.savedVendors.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) setVendors(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { fetch_(); }, []);

  const updateStatus = async (vendorItemId: number, contactStatus: string) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.savedVendors.updateStatus.path, { id: workspaceId, vendorItemId }));
      await fetchWithAuth(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactStatus }),
      });
      if (contactStatus === 'booked') Alert.alert('🎉 Finalised!', 'This choice has been saved to your Summary.');
      fetch_();
    } catch { Alert.alert('Error', 'Failed to update status.'); }
    setStatusModal(null);
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />;
  if (vendors.length === 0) return (
    <View style={styles.emptyState}>
      <Ionicons name="bookmark-outline" size={40} color={Colors.textSecondary} />
      <Text style={styles.emptyText}>Browse the directory and save your favourites</Text>
    </View>
  );

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingVertical: 4 }}>
        {vendors.map(sv => {
          const current = STATUS_OPTIONS.find(s => s.value === (sv.contactStatus || 'saved')) || STATUS_OPTIONS[0];
          return (
            <View key={sv.id} style={styles.savedCard}>
              <View style={styles.savedCardImage}>
                <Text style={styles.savedCardInitial}>{sv.vendorItem?.title?.charAt(0) || '?'}</Text>
              </View>
              <Text style={styles.savedCardTitle} numberOfLines={1}>{sv.vendorItem?.title}</Text>
              <TouchableOpacity
                style={[styles.statusPill, { backgroundColor: current.bg }]}
                onPress={() => setStatusModal(sv)}
              >
                <Text style={[styles.statusPillText, { color: current.fg }]}>{current.label}</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!statusModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setStatusModal(null)} activeOpacity={1}>
          <View style={styles.statusModalCard}>
            <Text style={styles.statusModalTitle}>Update Status</Text>
            {STATUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.statusOption, { backgroundColor: opt.value === statusModal?.contactStatus ? opt.bg : 'transparent' }]}
                onPress={() => statusModal && updateStatus(statusModal.vendorItemId, opt.value)}
              >
                <Text style={[styles.statusOptionText, { color: opt.value === statusModal?.contactStatus ? opt.fg : Colors.text }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// --- Budget Tab ---
function BudgetTab({ workspaceId }: { workspaceId: number }) {
  const { workspace } = useWorkspace();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetInput, setBudgetInput] = useState('');
  const [customCat, setCustomCat] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const fetch_ = useCallback(async () => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) setBudgetItems(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { fetch_(); }, []);

  const totalBudget = workspace?.totalBudget || 0;
  const totalSpent = budgetItems.reduce((s, i) => s + i.amount, 0);
  const remaining = totalBudget - totalSpent;

  const saveTotalBudget = async () => {
    const val = parseInt(budgetInput);
    if (isNaN(val) || val <= 0) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.settings.path, { id: workspaceId }));
      await fetchWithAuth(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalBudget: val }),
      });
    } catch { }
    setBudgetInput('');
  };

  const addCategory = async (cat: string) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.create.path, { id: workspaceId }));
      await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, amount: 0 }),
      });
      fetch_();
    } catch { }
    setCustomCat('');
    setShowCustom(false);
  };

  const deleteItem = async (itemId: number) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.delete.path, { id: workspaceId, itemId }));
      await fetchWithAuth(url, { method: 'DELETE' });
      fetch_();
    } catch { }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />;

  const existingCats = budgetItems.map(i => i.category.toLowerCase());
  const missing = BUDGET_CATEGORIES.filter(c => !existingCats.includes(c.toLowerCase()));

  return (
    <View style={styles.budgetCard}>
      <Text style={styles.budgetLabel}>What is your total budget?</Text>
      <View style={styles.budgetInputRow}>
        <Text style={styles.currencySign}>£</Text>
        <TextInput
          style={styles.budgetInput}
          placeholder="e.g. 15000"
          placeholderTextColor={Colors.textSecondary}
          value={budgetInput || (totalBudget > 0 ? String(totalBudget) : '')}
          onChangeText={setBudgetInput}
          onBlur={saveTotalBudget}
          keyboardType="number-pad"
        />
      </View>

      {totalBudget > 0 && (
        <View style={styles.remainingSection}>
          <Text style={styles.remainingAmount}>£{remaining.toLocaleString()}</Text>
          <Text style={styles.remainingLabel}>Remaining</Text>
        </View>
      )}

      {budgetItems.map(item => (
        <View key={item.id} style={styles.budgetRow}>
          <View style={styles.budgetRowHeader}>
            <Text style={styles.budgetCatName}>{item.category}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.budgetAmountText}>£{item.amount.toLocaleString()}</Text>
              <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Ionicons name="close" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {(missing.length > 0 || budgetItems.length === 0) && (
        <View style={styles.addCatsRow}>
          {budgetItems.length === 0 && <Text style={styles.addCatsHint}>Add categories to start budgeting:</Text>}
          <View style={styles.chipRow}>
            {missing.map(cat => (
              <TouchableOpacity key={cat} style={styles.addCatChip} onPress={() => addCategory(cat)}>
                <Ionicons name="add" size={12} color={Colors.gold} />
                <Text style={styles.addCatChipText}>{cat}</Text>
              </TouchableOpacity>
            ))}
            {!showCustom ? (
              <TouchableOpacity style={styles.addCatChipOutline} onPress={() => setShowCustom(true)}>
                <Ionicons name="add" size={12} color={Colors.textSecondary} />
                <Text style={styles.addCatChipOutlineText}>Custom</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.customInputRow}>
                <TextInput
                  style={styles.customInput}
                  placeholder="Category name"
                  placeholderTextColor={Colors.textSecondary}
                  value={customCat}
                  onChangeText={setCustomCat}
                  autoFocus
                />
                <TouchableOpacity style={styles.customAddBtn} onPress={() => customCat.trim() && addCategory(customCat.trim())}>
                  <Text style={styles.customAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

// --- Notes Tab ---
function NotesTab({ workspaceId }: { workspaceId: number }) {
  const router = useRouter();
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const url = toAbsoluteUrl(buildUrl(api.notes.list.path, { workspaceId }));
        const res = await fetchWithAuth(url);
        if (res.ok) { const data = await res.json(); setNoteCount(data.length); }
      } catch { }
    })();
  }, [workspaceId]);

  return (
    <TouchableOpacity
      style={styles.notesCard}
      onPress={() => router.push({ pathname: '/notes', params: { workspaceId } })}
      activeOpacity={0.8}
    >
      <View style={styles.notesIcon}>
        <Ionicons name="document-text" size={20} color={Colors.gold} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.notesTitle}>Notes</Text>
        <Text style={styles.notesSubtitle}>{noteCount === 0 ? 'Tap to start writing' : `${noteCount} note${noteCount !== 1 ? 's' : ''}`}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
    </TouchableOpacity>
  );
}

// --- Invites/Guest List Tab ---
function InvitesTab({ workspaceId }: { workspaceId: number }) {
  const [guests, setGuests] = useState<GuestInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestName, setGuestName] = useState('');

  const fetch_ = useCallback(async () => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.guestInvites.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) setGuests(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { fetch_(); }, []);

  const addGuest = async () => {
    if (!guestName.trim()) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.guestInvites.create.path, { id: workspaceId }));
      await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: guestName.trim(), rsvpStatus: 'pending' }),
      });
      setGuestName('');
      fetch_();
    } catch { }
  };

  const updateStatus = async (inviteId: number, rsvpStatus: string) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.guestInvites.update.path, { id: workspaceId, inviteId }));
      await fetchWithAuth(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rsvpStatus }),
      });
      fetch_();
    } catch { }
  };

  const deleteGuest = async (inviteId: number) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.guestInvites.delete.path, { id: workspaceId, inviteId }));
      await fetchWithAuth(url, { method: 'DELETE' });
      fetch_();
    } catch { }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />;

  const total = guests.length;
  const attending = guests.filter(g => g.rsvpStatus === 'attending').length;
  const pending = guests.filter(g => g.rsvpStatus === 'pending').length;
  const declined = guests.filter(g => g.rsvpStatus === 'not_attending').length;

  const statusColor = (s: string) => s === 'attending' ? Colors.gold : s === 'not_attending' ? Colors.rose : Colors.textSecondary;
  const statusLabel = (s: string) => s === 'attending' ? 'Confirmed' : s === 'not_attending' ? 'Declined' : 'Pending';

  return (
    <View style={{ gap: 16 }}>
      {/* Stats */}
      <View style={styles.guestStatsCard}>
        <View style={styles.guestStatMain}>
          <Text style={styles.guestStatBig}>{total}</Text>
          <Text style={styles.guestStatLabel}>Total Guests</Text>
        </View>
        <View style={styles.guestStatsDivider} />
        <View style={styles.guestStatsRow}>
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatMed, { color: Colors.gold }]}>{attending}</Text>
            <Text style={styles.guestStatSmLabel}>Confirmed</Text>
          </View>
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatMed, { color: Colors.textSecondary }]}>{pending}</Text>
            <Text style={styles.guestStatSmLabel}>Pending</Text>
          </View>
          <View style={styles.guestStatItem}>
            <Text style={[styles.guestStatMed, { color: Colors.rose }]}>{declined}</Text>
            <Text style={styles.guestStatSmLabel}>Declined</Text>
          </View>
        </View>
      </View>

      {/* Guest List */}
      {guests.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={40} color={Colors.gold} />
          <Text style={styles.emptyText}>No guests added yet</Text>
        </View>
      ) : (
        <View style={styles.guestListCard}>
          {guests.map((g, i) => (
            <View key={g.id} style={[styles.guestRow, i % 2 === 1 && { backgroundColor: Colors.background }]}>
              <Text style={styles.guestName} numberOfLines={1}>{g.guestName}</Text>
              <View style={styles.guestActions}>
                <TouchableOpacity onPress={() => {
                  const next = g.rsvpStatus === 'pending' ? 'attending' : g.rsvpStatus === 'attending' ? 'not_attending' : 'pending';
                  updateStatus(g.id, next);
                }}>
                  <Text style={[styles.guestStatusText, { color: statusColor(g.rsvpStatus) }]}>{statusLabel(g.rsvpStatus)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteGuest(g.id)}>
                  <Ionicons name="trash-outline" size={14} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Add Guest */}
      <View style={styles.addGuestCard}>
        <TextInput
          style={styles.addGuestInput}
          placeholder="Guest name"
          placeholderTextColor={Colors.textSecondary}
          value={guestName}
          onChangeText={setGuestName}
          onSubmitEditing={addGuest}
        />
        <TouchableOpacity style={styles.addGuestBtn} onPress={addGuest}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addGuestBtnText}>Add Guest</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Main Hub Screen ---
export default function HubTab() {
  const { workspaceId } = useWorkspace();
  const [activeTab, setActiveTab] = useState('saved');

  const tabs = [
    { value: 'saved', label: 'Saved' },
    { value: 'budget', label: 'Budget' },
    { value: 'notes', label: 'Notes' },
    { value: 'invites', label: 'Invites' },
  ];

  if (!workspaceId) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.hubScroll}>
        <Text style={styles.hubTitle}>Hub</Text>

        <View style={styles.hubTabRow}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.value}
              style={[styles.hubTab, activeTab === tab.value && styles.hubTabActive]}
              onPress={() => setActiveTab(tab.value)}
            >
              <Text style={[styles.hubTabText, activeTab === tab.value && styles.hubTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'saved' && <SavedTab workspaceId={workspaceId} />}
        {activeTab === 'budget' && <BudgetTab workspaceId={workspaceId} />}
        {activeTab === 'notes' && <NotesTab workspaceId={workspaceId} />}
        {activeTab === 'invites' && <InvitesTab workspaceId={workspaceId} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  hubScroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  hubTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text, letterSpacing: -0.5 },
  hubTabRow: { flexDirection: 'row', gap: 8 },
  hubTab: { borderRadius: BorderRadius.full, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.surface },
  hubTabActive: { backgroundColor: Colors.primary },
  hubTabText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.textSecondary },
  hubTabTextActive: { color: '#fff' },
  // Saved
  savedCard: { width: 160, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  savedCardImage: { height: 96, borderRadius: 12, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  savedCardInitial: { fontSize: 24, fontWeight: '700', color: Colors.gold },
  savedCardTitle: { fontSize: FontSize.md, fontFamily: FontFamily.sansSemiBold, color: Colors.text, marginBottom: 8 },
  statusPill: { borderRadius: BorderRadius.full, paddingVertical: 4, alignItems: 'center' },
  statusPillText: { fontSize: 10, fontWeight: '500' },
  // Status Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  statusModalCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.md, width: '80%', gap: 4 },
  statusModalTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text, marginBottom: 8 },
  statusOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  statusOptionText: { fontSize: FontSize.md, fontWeight: '500' },
  // Budget
  budgetCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: Spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  budgetLabel: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.text, marginBottom: 12 },
  budgetInputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)' },
  currencySign: { paddingLeft: 16, fontSize: FontSize.base, fontWeight: '500', color: Colors.textSecondary },
  budgetInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 14, fontSize: FontSize.lg, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  remainingSection: { alignItems: 'center', marginTop: 24 },
  remainingAmount: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  remainingLabel: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, marginTop: 4 },
  budgetRow: { marginTop: 20 },
  budgetRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCatName: { fontSize: FontSize.md, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  budgetAmountText: { fontSize: FontSize.md, fontFamily: FontFamily.serifBold, color: Colors.text },
  addCatsRow: { marginTop: 24 },
  addCatsHint: { fontSize: FontSize.md, color: Colors.textSecondary, marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  addCatChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(201,169,110,0.4)', borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 6 },
  addCatChipText: { fontSize: FontSize.xs, color: Colors.gold },
  addCatChipOutline: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(26,26,26,0.2)', borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 6 },
  addCatChipOutlineText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  customInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: 8 },
  customInput: { flex: 1, borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', paddingHorizontal: 12, paddingVertical: 8, fontSize: FontSize.md, color: Colors.text },
  customAddBtn: { borderRadius: BorderRadius.full, backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 8 },
  customAddBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '500' },
  // Notes
  notesCard: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  notesIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  notesTitle: { fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  notesSubtitle: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  // Invites
  guestStatsCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12, overflow: 'hidden' },
  guestStatMain: { alignItems: 'center', paddingVertical: 16 },
  guestStatBig: { fontSize: 56, fontFamily: FontFamily.serifBold, color: Colors.text },
  guestStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  guestStatsDivider: { height: 1, backgroundColor: '#F3F4F6' },
  guestStatsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12 },
  guestStatItem: { alignItems: 'center' },
  guestStatMed: { fontSize: FontSize.xxl, fontFamily: FontFamily.serifBold },
  guestStatSmLabel: { fontSize: 10, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  guestListCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  guestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  guestName: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.text, flex: 1 },
  guestActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  guestStatusText: { fontSize: FontSize.xs, fontWeight: '500' },
  addGuestCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
  addGuestInput: { borderRadius: 12, backgroundColor: Colors.background, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', paddingHorizontal: 16, paddingVertical: 10, fontSize: FontSize.md, color: Colors.text },
  addGuestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, height: 48, borderRadius: BorderRadius.full, backgroundColor: Colors.primary, marginTop: 12 },
  addGuestBtnText: { color: '#fff', fontSize: FontSize.md, fontFamily: FontFamily.sansMedium },
  // Shared
  emptyState: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { fontSize: FontSize.md, color: Colors.textSecondary },
});
