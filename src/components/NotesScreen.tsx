import { BorderRadius, Colors, FontFamily, FontSize, Spacing } from '@/constants/theme';
import { api, buildUrl, toAbsoluteUrl } from '@/lib/api';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import type { Note, SavedVendor, VendorItem } from '@/lib/types';
import { useNotes } from '@/lib/useNotes';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SavedVendorWithItem = SavedVendor & { vendorItem?: VendorItem };

const CATEGORY_LABELS: Record<string, string> = {
  hotel: 'Hotels',
  hall: 'Halls',
  mosque: 'Mosques',
  photographer: 'Photographers',
  caterer: 'Caterers',
  decorator: 'Decorators',
  mua: 'Hair & Makeup',
  dj: 'DJs & Entertainment',
};

interface NotesScreenProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  onNavigateToVendor?: (vendorItemId: number) => void;
}

/** Parse `@[Title](id)` mention tokens out of raw note text. */
function parseMentions(content: string): { type: 'text' | 'mention'; text: string; vendorItemId?: number }[] {
  const parts: { type: 'text' | 'mention'; text: string; vendorItemId?: number }[] = [];
  let lastIndex = 0;
  const re = /@\[(.+?)\]\((\d+)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'mention', text: `@${match[1]}`, vendorItemId: parseInt(match[2], 10) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }
  return parts;
}

function formatNoteDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function NotesScreen({ isOpen, onClose, workspaceId, onNavigateToVendor }: NotesScreenProps) {
  const { notes, isLoading, isCreating, isUpdating, createNote, updateNote, deleteNote, refresh } = useNotes(workspaceId);

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Vendor mention state
  const [savedVendors, setSavedVendors] = useState<SavedVendorWithItem[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  // Refs so selection/change handlers always see the latest values without stale closures
  const contentRef = useRef('');
  const cursorPosRef = useRef(0);

  // Fetch saved vendors once when the modal opens (served from server cache on re-open)
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const url = toAbsoluteUrl(buildUrl(api.savedVendors.list.path, { id: workspaceId }));
        const res = await fetchWithAuth(url);
        if (res.ok) setSavedVendors(await res.json());
      } catch { /* silently ignore */ }
    })();
  }, [isOpen, workspaceId]);

  const openNewNote = useCallback(() => {
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    contentRef.current = '';
    setMentionQuery(null);
    setIsEditing(true);
  }, []);

  const openEditNote = useCallback((note: Note) => {
    setEditingNoteId(note.id);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    contentRef.current = note.content;
    setMentionQuery(null);
    setIsEditing(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditing(false);
    setEditingNoteId(null);
    setNoteTitle('');
    setNoteContent('');
    contentRef.current = '';
    setMentionQuery(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!noteTitle.trim()) return;
    try {
      if (editingNoteId) {
        await updateNote(editingNoteId, { title: noteTitle.trim(), content: noteContent });
      } else {
        await createNote({ workspaceId, title: noteTitle.trim(), content: noteContent });
      }
      closeEditor();
      refresh();
    } catch {
      // Error is handled by the hook
    }
  }, [editingNoteId, noteTitle, noteContent, workspaceId, updateNote, createNote, closeEditor, refresh]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteNote(id);
    } catch {
      // Error is handled by the hook
    }
  }, [deleteNote]);

  // --- Mention detection (runs in onSelectionChange so cursor position is always fresh) ---

  const handleContentChange = useCallback((text: string) => {
    contentRef.current = text;
    setNoteContent(text);
  }, []);

  const handleSelectionChange = useCallback((e: { nativeEvent: { selection: { start: number; end: number } } }) => {
    const pos = e.nativeEvent.selection.start;
    cursorPosRef.current = pos;
    const text = contentRef.current;

    const beforeCursor = text.slice(0, pos);
    const atIndex = beforeCursor.lastIndexOf('@');
    if (atIndex === -1) { setMentionQuery(null); return; }

    // @ must be at the very start or preceded by whitespace (prevents email addresses triggering picker)
    if (atIndex > 0 && !/[\s\n]/.test(beforeCursor[atIndex - 1])) { setMentionQuery(null); return; }

    const query = beforeCursor.slice(atIndex + 1);
    // No whitespace between @ and cursor — this must be a single word prefix
    if (/[\s\n]/.test(query)) { setMentionQuery(null); return; }

    setMentionQuery(query);
    setMentionStart(atIndex);
  }, []);

  /** Replace the `@query` segment with a formatted mention token. */
  const insertMention = useCallback((sv: SavedVendorWithItem) => {
    const title = sv.vendorItem?.title || 'Vendor';
    const mention = `@[${title}](${sv.vendorItemId})`;
    const before = contentRef.current.slice(0, mentionStart);
    const after = contentRef.current.slice(cursorPosRef.current);
    const newContent = before + mention + after;
    contentRef.current = newContent;
    setNoteContent(newContent);
    setMentionQuery(null);
  }, [mentionStart]);

  /** Filtered list shown inside the picker. */
  const filteredVendors = useMemo(() => {
    if (mentionQuery === null) return [];
    if (mentionQuery === '') return savedVendors;
    const q = mentionQuery.toLowerCase();
    return savedVendors.filter(sv => sv.vendorItem?.title?.toLowerCase().includes(q));
  }, [mentionQuery, savedVendors]);

  /** Called when a rendered mention chip is tapped in the notes list. */
  const handleMentionPress = useCallback((vendorItemId: number) => {
    onClose();
    onNavigateToVendor?.(vendorItemId);
  }, [onClose, onNavigateToVendor]);

  const isSaving = isCreating || isUpdating;
  const canSave = noteTitle.trim().length > 0 && !isSaving;

  return (
    <>
      {/* Layer 2: Notes List */}
      <Modal visible={isOpen} animationType="slide" presentationStyle="fullScreen">
        <SafeAreaView style={styles.screen}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <Ionicons name="chevron-back" size={28} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notes</Text>
            <View style={{ width: 28 }} />
          </View>

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {isLoading && !notes ? (
              <View style={styles.centerState}>
                <ActivityIndicator size="large" color={Colors.gold} />
              </View>
            ) : !notes || notes.length === 0 ? (
              <View style={styles.centerState}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="document-text" size={40} color={Colors.gold} />
                </View>
                <Text style={styles.emptyTitle}>No notes yet</Text>
                <Text style={styles.emptySubtitle}>Tap + to create your first note</Text>
              </View>
            ) : (
              notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  style={styles.noteCard}
                  activeOpacity={0.7}
                  onPress={() => openEditNote(note)}
                >
                  <View style={styles.noteCardHeader}>
                    <Text style={styles.noteCardTitle} numberOfLines={1}>{note.title}</Text>
                    <TouchableOpacity
                      hitSlop={12}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.noteCardDate}>{formatNoteDate(note.updatedAt)}</Text>
                  <NoteContent
                    content={note.content}
                    numberOfLines={3}
                    onMentionPress={handleMentionPress}
                  />
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* FAB */}
          <TouchableOpacity style={styles.fab} activeOpacity={0.8} onPress={openNewNote}>
            <Ionicons name="add" size={28} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Layer 3: Note Editor */}
        <Modal visible={isEditing} animationType="slide" presentationStyle="fullScreen">
          <SafeAreaView style={styles.screen}>
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              {/* Editor Header */}
              <View style={styles.editorHeader}>
                <TouchableOpacity onPress={closeEditor} hitSlop={12}>
                  <Ionicons name="close" size={28} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, !canSave && styles.saveBtnDisabled]}
                  disabled={!canSave}
                  onPress={handleSave}
                >
                  <Text style={[styles.saveBtnText, !canSave && styles.saveBtnTextDisabled]}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Editor Body */}
              <View style={styles.editorBody}>
                <TextInput
                  style={styles.titleInput}
                  placeholder="Note title"
                  placeholderTextColor={Colors.textSecondary}
                  value={noteTitle}
                  onChangeText={setNoteTitle}
                  autoFocus={!editingNoteId}
                />
                <TextInput
                  style={styles.contentInput}
                  placeholder="Brain dump your ideas… type @ to mention a saved vendor"
                  placeholderTextColor={Colors.textSecondary}
                  value={noteContent}
                  onChangeText={handleContentChange}
                  onSelectionChange={handleSelectionChange}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Mention Picker — sits between content and keyboard */}
              {mentionQuery !== null && (
                <MentionPicker
                  vendors={filteredVendors}
                  onSelect={insertMention}
                  onDismiss={() => setMentionQuery(null)}
                />
              )}
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Modal>
      </Modal>
    </>
  );
}

// --- NoteContent: inline text with tappable @[Mention](id) chips ---
function NoteContent({
  content,
  numberOfLines,
  onMentionPress,
}: {
  content: string;
  numberOfLines?: number;
  onMentionPress: (vendorItemId: number) => void;
}) {
  const parts = parseMentions(content);
  return (
    <Text style={styles.noteCardContent} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.type === 'mention' ? (
          <Text key={i} style={styles.mentionChip} onPress={() => onMentionPress(part.vendorItemId!)}>
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        )
      )}
    </Text>
  );
}

// --- MentionPicker: compact vendor list that sits above the keyboard ---
function MentionPicker({
  vendors,
  onSelect,
  onDismiss,
}: {
  vendors: SavedVendorWithItem[];
  onSelect: (sv: SavedVendorWithItem) => void;
  onDismiss: () => void;
}) {
  return (
    <View style={styles.pickerContainer}>
      <View style={styles.pickerHeader}>
        <Text style={styles.pickerTitle}>Saved Vendors</Text>
        <TouchableOpacity onPress={onDismiss} hitSlop={8}>
          <Ionicons name="close" size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      {vendors.length === 0 ? (
        <View style={styles.pickerEmpty}>
          <Text style={styles.pickerEmptyText}>No saved vendors match</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.pickerScroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {vendors.map((sv) => (
            <TouchableOpacity key={sv.id} style={styles.pickerItem} onPress={() => onSelect(sv)}>
              <View style={styles.pickerItemAvatar}>
                <Text style={styles.pickerItemAvatarText}>
                  {sv.vendorItem?.title?.charAt(0) ?? '?'}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.pickerItemName} numberOfLines={1}>{sv.vendorItem?.title}</Text>
                {sv.vendorItem?.vendorCategory && (
                  <Text style={styles.pickerItemCategory}>
                    {CATEGORY_LABELS[sv.vendorItem.vendorCategory] ?? sv.vendorItem.vendorCategory}
                  </Text>
                )}
              </View>
              <Ionicons name="at" size={14} color={Colors.gold} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FDFAF6',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
  },
  // Body
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
    gap: 16,
  },
  // Empty / Loading states
  centerState: {
    alignItems: 'center',
    paddingTop: 120,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
  // Note card
  noteCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  noteCardTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.sansSemiBold,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  noteCardDate: {
    fontSize: 10,
    fontFamily: FontFamily.sans,
    color: Colors.gold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  noteCardContent: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  // Editor Header
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansSemiBold,
    color: '#fff',
  },
  saveBtnTextDisabled: {
    color: '#fff',
  },
  // Editor Body
  editorBody: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  titleInput: {
    fontSize: 24,
    fontFamily: FontFamily.serifBold,
    color: Colors.text,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  contentInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.sans,
    color: Colors.text,
    lineHeight: 24,
    backgroundColor: 'transparent',
    paddingTop: 8,
  },
  // Mention chip (rendered in the note list)
  mentionChip: {
    color: Colors.gold,
    fontFamily: FontFamily.sansSemiBold,
  },
  // Mention picker
  pickerContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(26,26,26,0.12)',
    backgroundColor: Colors.surface,
    maxHeight: 220,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(26,26,26,0.08)',
  },
  pickerTitle: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.sansMedium,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pickerScroll: {
    maxHeight: 160,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    gap: 12,
  },
  pickerItemAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.goldLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemAvatarText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.serifBold,
    color: Colors.gold,
  },
  pickerItemName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sansMedium,
    color: Colors.text,
  },
  pickerItemCategory: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  pickerEmpty: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  pickerEmptyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.sans,
    color: Colors.textSecondary,
  },
});
