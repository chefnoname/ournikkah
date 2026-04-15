import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { FontFamily } from '@/constants/theme';
import type { Note } from '@/lib/types';
import { useNotes } from '@/lib/useNotes';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

export default function NotesListScreen() {
  const router = useRouter();
  const { workspaceId: workspaceIdParam } = useLocalSearchParams();
  const workspaceId = parseInt(workspaceIdParam as string, 10) || 0;

  const { notes, isLoading, error, refresh, deleteNote } = useNotes(workspaceId);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  };


  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
    } finally {
      setDeletingId(null);
    }
  };

  handleDelete(1000); // Example usage, replace with actual note ID to delete

  const handleNavigateToNote = (note: Note) => {
    router.push({
      pathname: '/notes/[id]',
      params: {
        id: note.id,
        workspaceId,
        title: note.title,
        content: note.content,
      },
    });
  };

  const handleCreateNote = () => {
    router.push({
      pathname: '/notes/new',
      params: { workspaceId },
    });
  };

  const renderNoteItem = ({ item }: { item: Note }) => {
    const isDeleting = deletingId === item.id;
    const preview = item.content.substring(0, 80) + (item.content.length > 80 ? '...' : '');
    const createdDate = new Date(item.createdAt).toLocaleDateString();

    return (
      <Pressable
        onPress={() => handleNavigateToNote(item)}
        disabled={isDeleting}
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <Card style={styles.noteCard}>
          <CardContent>
            <View style={styles.noteHeader}>
              <Text style={styles.noteTitle}>{item.title}</Text>
              {isDeleting && <ActivityIndicator size="small" />}
            </View>
            <Text style={styles.noteContent}>{preview}</Text>
            <View style={styles.noteFooter}>
              <Text style={styles.noteDate}>{createdDate}</Text>
              <Text style={styles.noteAuthor}>{item.updatedByEmail}</Text>
            </View>
          </CardContent>
        </Card>
      </Pressable>
    );
  };

  if (isLoading && !notes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading notes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
          <Button
            onPress={handleRefresh}
            style={styles.retryButton}
          >
            Retry
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const isEmpty = !notes || notes.length === 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
        <Button
          variant="default"
          size="sm"
          onPress={handleCreateNote}
        >
          New Note
        </Button>
      </View>

      <Separator />

      {isEmpty ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No notes yet</Text>
          <Text style={styles.emptySubtext}>Create your first note to get started</Text>
          <Button
            onPress={handleCreateNote}
            style={styles.createButton}
          >
            Create Note
          </Button>
        </View>
      ) : (
        <FlatList
          data={notes}
          renderItem={renderNoteItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 12,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FontFamily.sansSemiBold,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: FontFamily.sans,
    color: '#6b7280',
    marginBottom: 20,
  },
  createButton: {
    marginTop: 12,
  },
  listContent: {
    padding: 12,
    gap: 12,
  },
  noteCard: {
    marginBottom: 0,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontFamily: FontFamily.serifBold,
    flex: 1,
    marginRight: 8,
  },
  noteContent: {
    fontSize: 14,
    fontFamily: FontFamily.sans,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 10,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
  },
  noteDate: {
    fontSize: 12,
    fontFamily: FontFamily.sans,
    color: '#9ca3af',
  },
  noteAuthor: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
