import { BorderRadius, Colors, FontFamily, FontSize, GradientConfig, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { BudgetItem, GuestInvite, SavedVendor } from '@/lib/types';
import { useWorkspace } from '@/lib/useWorkspace';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G } from 'react-native-svg';
import Slider from '@react-native-community/slider';

type SavedVendorWithItem = SavedVendor & { vendorItem?: any };

const STATUS_OPTIONS = [
  { value: 'saved', label: 'Saved', bg: '#F3F4F6', fg: '#6B6B6B' },
  { value: 'contacted', label: 'Contacted', bg: Colors.goldLight, fg: Colors.gold },
  { value: 'awaiting_reply', label: 'Awaiting Reply', bg: Colors.goldLight, fg: Colors.gold },
  { value: 'met_visited', label: 'Met / Visited', bg: '#E8F4F0', fg: '#4A9B7F' },
  { value: 'booked', label: 'Booked ✓', bg: Colors.primary, fg: '#fff' },
];

const BUDGET_CATEGORIES = ['Venue', 'Catering', 'Officiant', 'Invitations', 'Attire', 'Other'];

const CATEGORY_COLORS: Record<string, string> = {
  Venue: '#C9A96E',
  Catering: '#E8C4B8',
  Officiant: '#7AACB3',
  Invitations: '#D4A5D0',
  Attire: '#8BB58E',
  Other: '#E0B86B',
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || `hsl(${Math.abs(category.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % 360}, 55%, 60%)`;
}

function DonutChart({
  items,
  totalBudget,
  size = 200,
  strokeWidth = 28,
}: {
  items: { category: string; amount: number }[];
  totalBudget: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;
  const totalAllocated = items.reduce((s, i) => s + i.amount, 0);

  const segments: { color: string; offset: number; length: number; category: string }[] = [];
  let accumulated = 0;
  for (const item of items) {
    if (item.amount <= 0 || totalBudget <= 0) continue;
    const fraction = item.amount / totalBudget;
    const length = fraction * circumference;
    const offset = circumference - accumulated * circumference / totalBudget;
    segments.push({ color: getCategoryColor(item.category), offset, length, category: item.category });
    accumulated += item.amount;
  }

  const remainingFraction = totalBudget > 0 ? Math.max(0, (totalBudget - totalAllocated) / totalBudget) : 1;

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* Background ring */}
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Category segments */}
          {segments.map((seg, i) => (
            <Circle
              key={`${seg.category}-${i}`}
              cx={center}
              cy={center}
              r={radius}
              stroke={seg.color}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${seg.length} ${circumference - seg.length}`}
              strokeDashoffset={seg.offset}
              strokeLinecap="butt"
            />
          ))}
        </G>
      </Svg>
      {/* Center text */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary }}>
          {totalBudget > 0 ? `${Math.round((1 - remainingFraction) * 100)}%` : '0%'}
        </Text>
        <Text style={{ fontSize: FontSize.xs, fontFamily: FontFamily.sans, color: Colors.textSecondary }}>allocated</Text>
      </View>
    </View>
  );
}

// --- Saved Tab ---
function SavedTab({ workspaceId, refreshKey }: { workspaceId: number; refreshKey: number }) {
  const [vendors, setVendors] = useState<SavedVendorWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState<SavedVendorWithItem | null>(null);
  const [detailItem, setDetailItem] = useState<SavedVendorWithItem | null>(null);

  const fetch_ = useCallback(async () => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.savedVendors.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) setVendors(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { fetch_(); }, [refreshKey]);

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

  const handleRemove = (sv: SavedVendorWithItem) => {
    Alert.alert(
      'Remove Vendor',
      `Remove ${sv.vendorItem?.title || 'this vendor'} from your hub?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const url = toAbsoluteUrl(buildUrl(api.savedVendors.remove.path, { id: workspaceId, vendorId: sv.id }));
              const res = await fetchWithAuth(url, { method: 'DELETE' });
              if (res.ok) {
                setDetailItem(null);
                fetch_();
              } else {
                Alert.alert('Error', 'Could not remove vendor.');
              }
            } catch {
              Alert.alert('Error', 'Could not remove vendor.');
            }
          },
        },
      ]
    );
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
      <View style={styles.savedGrid}>
        {vendors.map(sv => {
          const current = STATUS_OPTIONS.find(s => s.value === (sv.contactStatus || 'saved')) || STATUS_OPTIONS[0];
          return (
            <TouchableOpacity key={sv.id} style={styles.savedCard} onPress={() => setDetailItem(sv)} activeOpacity={0.8}>
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
            </TouchableOpacity>
          );
        })}
      </View>

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

      <Modal visible={!!detailItem} animationType="slide" presentationStyle="pageSheet">
        {detailItem && (
          <SafeAreaView style={styles.detailModalContainer}>
            <ScrollView contentContainerStyle={styles.detailModalScroll}>
              <TouchableOpacity style={styles.detailModalBackBtn} onPress={() => setDetailItem(null)}>
                <Ionicons name="chevron-back" size={24} color={Colors.text} />
              </TouchableOpacity>

              {detailItem.vendorItem?.section === 'venue' ? (
                <View style={styles.detailModalImagePlaceholder}>
                  <Ionicons name="business" size={48} color={Colors.gold} />
                </View>
              ) : (
                <View style={styles.detailModalAvatarWrap}>
                  <View style={styles.detailModalAvatar}>
                    <Text style={styles.detailModalAvatarText}>{detailItem.vendorItem?.title?.charAt(0) || '?'}</Text>
                  </View>
                </View>
              )}

              <View style={styles.detailModalBody}>
                <Text style={styles.detailModalTitle}>{detailItem.vendorItem?.title}</Text>
                <View style={styles.detailModalMetaRow}>
                  {detailItem.vendorItem?.vendorCategory && (
                    <View style={styles.detailCatBadge}>
                      <Text style={styles.detailCatBadgeText}>
                        {detailItem.vendorItem.vendorCategory === 'mua' ? 'MUA' : detailItem.vendorItem.vendorCategory.charAt(0).toUpperCase() + detailItem.vendorItem.vendorCategory.slice(1)}
                      </Text>
                    </View>
                  )}
                  {detailItem.vendorItem?.priceRange && (
                    <View style={styles.detailPriceBadge}><Text style={styles.detailPriceBadgeText}>{detailItem.vendorItem.priceRange}</Text></View>
                  )}
                  {detailItem.vendorItem?.location && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
                      <Text style={styles.detailLocationText}>{detailItem.vendorItem.location}</Text>
                    </View>
                  )}
                </View>

                {detailItem.vendorItem?.bio && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionLabel}>ABOUT</Text>
                    <Text style={styles.detailSectionText}>{detailItem.vendorItem.bio}</Text>
                  </View>
                )}

                {detailItem.vendorItem?.capacity && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
                    <Ionicons name="people" size={16} color={Colors.gold} />
                    <Text style={styles.detailSectionText}>Capacity: {detailItem.vendorItem.capacity}</Text>
                  </View>
                )}

                {detailItem.vendorItem?.contactEmail && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionLabel}>CONTACT</Text>
                    <View style={styles.detailContactRow}>
                      <Ionicons name="mail" size={16} color={Colors.gold} />
                      <Text style={styles.detailContactText}>{detailItem.vendorItem.contactEmail}</Text>
                    </View>
                    {detailItem.vendorItem?.contactPhone && (
                      <View style={styles.detailContactRow}>
                        <Ionicons name="call" size={16} color={Colors.gold} />
                        <Text style={styles.detailContactText}>{detailItem.vendorItem.contactPhone}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.detailModalFooter}>
              <View style={styles.detailFooterRow}>
                {(() => {
                  const current = STATUS_OPTIONS.find(s => s.value === (detailItem.contactStatus || 'saved')) || STATUS_OPTIONS[0];
                  return (
                    <TouchableOpacity
                      style={[styles.detailStatusBtn, { backgroundColor: current.bg, flex: 1 }]}
                      onPress={() => { setDetailItem(null); setStatusModal(detailItem); }}
                    >
                      <Ionicons name="flag-outline" size={18} color={current.fg} />
                      <Text style={[styles.detailStatusBtnText, { color: current.fg }]}>{current.label} — Tap to update</Text>
                    </TouchableOpacity>
                  );
                })()}
                <TouchableOpacity
                  style={styles.detailRemoveBtn}
                  onPress={() => handleRemove(detailItem)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error || '#E53935'} />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        )}
      </Modal>
    </>
  );
}

// --- Budget Slider Row (always visible, inline X to delete) ---
function BudgetSliderRow({
  item,
  maxValue,
  localValue,
  onSliderChange,
  onDelete,
}: {
  item: BudgetItem;
  maxValue: number;
  localValue: number | undefined;
  onSliderChange: (itemId: number, value: number) => void;
  onDelete: (itemId: number) => void;
}) {
  const color = getCategoryColor(item.category);
  const step = Math.max(50, Math.round(maxValue / 100 / 50) * 50);

  // Internal state keeps the native slider thumb stable during gestures.
  // Only sync from parent when NOT actively dragging.
  const dragging = useRef(false);
  const [internalValue, setInternalValue] = useState(localValue ?? safeNum(item.amount));

  useEffect(() => {
    if (!dragging.current) {
      setInternalValue(localValue ?? safeNum(item.amount));
    }
  }, [localValue, item.amount]);

  return (
    <View style={styles.budgetRow}>
      <View style={styles.budgetRowHeader}>
        <Text style={styles.budgetCatName}>{item.category}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={styles.budgetAmountText}>£{internalValue.toLocaleString()}</Text>
          <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={8}>
            <Ionicons name="close" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={maxValue}
        step={step}
        value={internalValue}
        onSlidingStart={() => { dragging.current = true; }}
        onValueChange={(v: number) => {
          const safe = safeNum(v);
          setInternalValue(safe);
          onSliderChange(item.id, safe);
        }}
        onSlidingComplete={() => { dragging.current = false; }}
        minimumTrackTintColor={color}
        maximumTrackTintColor="#F3F4F6"
        thumbTintColor={color}
      />
    </View>
  );
}

/** Guarantee a finite number — any junk becomes 0 */
function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// --- Budget Tab ---
function BudgetTab({ workspaceId }: { workspaceId: number }) {
  const { workspace, fetchWorkspace } = useWorkspace();
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [customCat, setCustomCat] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');
  const [localSliders, setLocalSliders] = useState<Record<number, number>>({});
  const debounceTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const fetchItems = useCallback(async () => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.list.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) {
        const items: BudgetItem[] = await res.json();
        // Ensure every item has a numeric amount
        setBudgetItems(items.map(i => ({ ...i, amount: safeNum(i.amount) })));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [workspaceId]);

  useEffect(() => { fetchItems(); }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    const timers = debounceTimers.current;
    return () => { Object.values(timers).forEach(clearTimeout); };
  }, []);

  const totalBudget = workspace?.totalBudget || 0;
  const totalSpent = budgetItems.reduce(
    (sum, item) => sum + (localSliders[item.id] ?? safeNum(item.amount)),
    0
  );
  const remaining = totalBudget - totalSpent;

  const saveTotalBudget = async () => {
    const val = parseInt(budgetInput);
    if (isNaN(val) || val <= 0) { setBudgetInput(''); setEditingBudget(false); return; }
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.settings.path, { id: workspaceId }));
      await fetchWithAuth(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalBudget: val }),
      });
      // Delete all categories when budget changes
      for (const item of budgetItems) {
        const itemUrl = toAbsoluteUrl(buildUrl(api.budget.delete.path, { id: workspaceId, itemId: item.id }));
        await fetchWithAuth(itemUrl, { method: 'DELETE' });
      }
      await fetchWorkspace();
      await fetchItems();
      setLocalSliders({});
    } catch { }
    setBudgetInput('');
    setEditingBudget(false);
  };

  const addCategory = async (cat: string) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.create.path, { id: workspaceId }));
      await fetchWithAuth(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat, amount: 0 }),
      });
      await fetchItems();
    } catch { }
    setCustomCat('');
    setShowCustom(false);
  };

  const handleSliderChange = useCallback((itemId: number, value: number) => {
    const safe = safeNum(value);
    setLocalSliders(prev => ({ ...prev, [itemId]: safe }));

    if (debounceTimers.current[itemId]) clearTimeout(debounceTimers.current[itemId]);

    debounceTimers.current[itemId] = setTimeout(async () => {
      try {
        const url = toAbsoluteUrl(buildUrl(api.budget.update.path, { id: workspaceId, itemId }));
        await fetchWithAuth(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: safe }),
        });
        // Update the server-state array in place instead of re-fetching,
        // so other sliders that are mid-drag don't get disrupted.
        setBudgetItems(prev => prev.map(i => i.id === itemId ? { ...i, amount: safe } : i));
        setLocalSliders(prev => {
          const next = { ...prev };
          delete next[itemId];
          return next;
        });
      } catch (e) { console.error(e); }
    }, 300);
  }, [workspaceId]);

  const deleteItem = useCallback(async (itemId: number) => {
    try {
      const url = toAbsoluteUrl(buildUrl(api.budget.delete.path, { id: workspaceId, itemId }));
      await fetchWithAuth(url, { method: 'DELETE' });
      await fetchItems();
    } catch { }
  }, [workspaceId, fetchItems]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />;

  const existingCats = budgetItems.map(i => i.category.toLowerCase());
  const missing = BUDGET_CATEGORIES.filter(c => !existingCats.includes(c.toLowerCase()));

  const chartItems = budgetItems.map(i => ({
    category: i.category,
    amount: localSliders[i.id] ?? safeNum(i.amount),
  }));

  const sliderMax = totalBudget > 0 ? totalBudget : 50000;

  return (
    <View style={styles.budgetCard}>
      {/* Budget display / edit */}
      {!editingBudget && totalBudget > 0 ? (
        <View>
          <Text style={styles.budgetLabel}>Total Budget</Text>
          <View style={styles.budgetDisplayRow}>
            <Text style={styles.budgetDisplayAmount}>£{totalBudget.toLocaleString()}</Text>
            <TouchableOpacity
              style={styles.budgetEditBtn}
              onPress={() => { setEditingBudget(true); setBudgetInput(String(totalBudget)); }}
            >
              <Ionicons name="pencil" size={14} color={Colors.gold} />
              <Text style={styles.budgetEditBtnText}>Change</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View>
          <Text style={styles.budgetLabel}>
            {totalBudget > 0 ? 'Enter new budget' : 'What is your total budget?'}
          </Text>
          <View style={styles.budgetInputRow}>
            <Text style={styles.currencySign}>£</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="e.g. 15000"
              placeholderTextColor={Colors.textSecondary}
              value={budgetInput}
              onChangeText={setBudgetInput}
              keyboardType="number-pad"
              autoFocus={editingBudget}
            />
          </View>
          <View style={styles.budgetConfirmRow}>
            <TouchableOpacity style={styles.budgetConfirmBtn} onPress={saveTotalBudget}>
              <Text style={styles.budgetConfirmBtnText}>Confirm</Text>
            </TouchableOpacity>
            {totalBudget > 0 && (
              <TouchableOpacity
                style={styles.budgetCancelBtn}
                onPress={() => { setEditingBudget(false); setBudgetInput(''); }}
              >
                <Text style={styles.budgetCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {totalBudget > 0 && (
        <>
          {/* Donut Chart */}
          <View style={styles.donutSection}>
            <DonutChart items={chartItems} totalBudget={totalBudget} />
          </View>

          {/* Remaining */}
          <View style={styles.remainingSection}>
            <Text style={[styles.remainingAmount, remaining < 0 && { color: Colors.error }]}>
              £{Math.abs(remaining).toLocaleString()}
            </Text>
            <Text style={styles.remainingLabel}>
              {remaining < 0 ? 'Over Budget' : 'Remaining'}
            </Text>
          </View>

          {/* Legend */}
          {budgetItems.length > 0 && (
            <View style={styles.legendRow}>
              {budgetItems.map(item => (
                <View key={item.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: getCategoryColor(item.category) }]} />
                  <Text style={styles.legendText}>{item.category}</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Category sliders */}
      {budgetItems.map(item => (
        <BudgetSliderRow
          key={item.id}
          item={item}
          maxValue={sliderMax}
          localValue={localSliders[item.id]}
          onSliderChange={handleSliderChange}
          onDelete={deleteItem}
        />
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
  const params = useLocalSearchParams<{ tab?: string }>();
  const validTabs = ['saved', 'budget', 'notes', 'invites'];
  const initialTab = params.tab && validTabs.includes(params.tab) ? params.tab : 'saved';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [refreshKey, setRefreshKey] = useState(0);

  // React to route param changes from home quick actions
  useEffect(() => {
    if (params.tab && validTabs.includes(params.tab)) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);

  useFocusEffect(useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []));

  const tabs = [
    { value: 'saved', label: 'Saved' },
    { value: 'budget', label: 'Budget' },
    { value: 'notes', label: 'Notes' },
    { value: 'invites', label: 'Invites' },
  ];

  if (!workspaceId) return null;

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
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

          {activeTab === 'saved' && <SavedTab workspaceId={workspaceId} refreshKey={refreshKey} />}
          {activeTab === 'budget' && <BudgetTab workspaceId={workspaceId} />}
          {activeTab === 'notes' && <NotesTab workspaceId={workspaceId} />}
          {activeTab === 'invites' && <InvitesTab workspaceId={workspaceId} />}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  hubScroll: { padding: Spacing.lg, paddingBottom: 120, gap: Spacing.lg },
  hubTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text, letterSpacing: -0.5 },
  hubTabRow: { flexDirection: 'row', gap: 8 },
  hubTab: { borderRadius: BorderRadius.full, paddingHorizontal: 20, paddingVertical: 8, backgroundColor: Colors.surface },
  hubTabActive: { backgroundColor: Colors.primary },
  hubTabText: { fontSize: FontSize.md, fontFamily: FontFamily.sansMedium, color: Colors.textSecondary },
  hubTabTextActive: { color: '#fff' },
  // Saved
  savedGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  savedCard: { width: '48%', backgroundColor: Colors.surface, borderRadius: BorderRadius.xl, padding: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 12 },
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
  budgetDisplayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  budgetDisplayAmount: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  budgetEditBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight },
  budgetEditBtnText: { fontSize: FontSize.xs, fontFamily: FontFamily.sansMedium, color: Colors.gold },
  budgetConfirmRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  budgetConfirmBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.full, backgroundColor: Colors.primary },
  budgetConfirmBtnText: { color: '#fff', fontSize: FontSize.md, fontFamily: FontFamily.sansSemiBold },
  budgetCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: BorderRadius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)' },
  budgetCancelBtnText: { color: Colors.textSecondary, fontSize: FontSize.md, fontFamily: FontFamily.sansMedium },
  remainingSection: { alignItems: 'center', marginTop: 8 },
  remainingAmount: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  remainingLabel: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, marginTop: 4 },
  budgetRow: { marginTop: 20 },
  budgetRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  budgetCatName: { fontSize: FontSize.md, fontFamily: FontFamily.sansSemiBold, color: Colors.text },
  budgetAmountText: { fontSize: FontSize.md, fontFamily: FontFamily.serifBold, color: Colors.text },
  donutSection: { alignItems: 'center', marginTop: 24, marginBottom: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16, marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: FontSize.xs, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  sliderContainer: { marginTop: 8, paddingHorizontal: 4 },
  sliderPreviewText: { fontSize: FontSize.lg, fontFamily: FontFamily.serifBold, color: Colors.text, textAlign: 'center', marginBottom: 4 },
  slider: { width: '100%', height: 40 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  sliderLabelText: { fontSize: FontSize.xs, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  sliderActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  sliderConfirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.gold },
  sliderConfirmBtnText: { fontSize: FontSize.xs, fontFamily: FontFamily.sansSemiBold, color: '#fff' },
  removeCatBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  removeCatBtnText: { fontSize: FontSize.xs, color: Colors.error },
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
  // Detail Modal
  detailModalContainer: { flex: 1, backgroundColor: Colors.surface },
  detailModalScroll: { paddingBottom: 100 },
  detailModalBackBtn: { padding: 16 },
  detailModalImagePlaceholder: { height: 220, backgroundColor: Colors.goldLight, justifyContent: 'center', alignItems: 'center' },
  detailModalAvatarWrap: { alignItems: 'center', paddingTop: 24 },
  detailModalAvatar: { width: 112, height: 112, borderRadius: 56, backgroundColor: Colors.gold, justifyContent: 'center', alignItems: 'center' },
  detailModalAvatarText: { color: '#fff', fontSize: 40, fontFamily: FontFamily.serifBold },
  detailModalBody: { padding: Spacing.lg },
  detailModalTitle: { fontSize: FontSize.xxxl, fontFamily: FontFamily.serifBold, color: Colors.text },
  detailModalMetaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 },
  detailCatBadge: { borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight, paddingHorizontal: 12, paddingVertical: 4 },
  detailCatBadgeText: { fontSize: 11, fontWeight: '500', color: Colors.gold },
  detailPriceBadge: { borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(26,26,26,0.1)', paddingHorizontal: 12, paddingVertical: 4 },
  detailPriceBadgeText: { fontSize: 11, fontWeight: '500', color: Colors.text },
  detailLocationText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary },
  detailSection: { marginTop: 24 },
  detailSectionLabel: { fontSize: FontSize.xs, fontFamily: FontFamily.sansSemiBold, color: Colors.gold, letterSpacing: 1, marginBottom: 8 },
  detailSectionText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.textSecondary, lineHeight: 22 },
  detailContactRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.background, borderRadius: 12, padding: 12, marginTop: 8 },
  detailContactText: { fontSize: FontSize.md, fontFamily: FontFamily.sans, color: Colors.text },
  detailModalFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: Spacing.lg, backgroundColor: Colors.surface },
  detailStatusBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 56, borderRadius: BorderRadius.full },
  detailStatusBtnText: { fontSize: FontSize.base, fontFamily: FontFamily.sansSemiBold },
  detailFooterRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  detailRemoveBtn: { width: 56, height: 56, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(229,57,53,0.3)', alignItems: 'center', justifyContent: 'center' },
});
