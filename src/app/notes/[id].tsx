import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { GradientConfig } from '@/constants/theme';
import { useNotes } from '@/lib/useNotes';
import { validateNote } from '@/lib/validation';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';

export default function NoteDetailScreen() {
  const router = useRouter();
  const {
    id: idParam,
    workspaceId: workspaceIdParam,
    title: initialTitle,
    content: initialContent,
  } = useLocalSearchParams();

  const noteId = parseInt(idParam as string, 10);
  const workspaceId = parseInt(workspaceIdParam as string, 10);

  const [title, setTitle] = useState(initialTitle as string);
  const [content, setContent] = useState(initialContent as string);
  const [error, setError] = useState<string | null>(null);

  const { updateNote, deleteNote, isUpdating, isDeleting } = useNotes(workspaceId);

  const handleUpdate = async () => {
    setError(null);

    // Validate
    const validation = validateNote(title, content);
    if (!validation.valid) {
      setError(validation.message || 'Invalid note');
      return;
    }

    try {
      await updateNote(noteId, {
        title,
        content,
      });

      // Success - navigate back
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update note';
      setError(message);
      Alert.alert('Error', message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteNote(noteId);
            router.back();
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete note';
            Alert.alert('Error', message);
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const isLoading = isUpdating || isDeleting;

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Edit Note</Text>
          </View>

          <Separator />

          <View style={styles.form}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Title</Text>
              <Input
                value={title}
                onChangeText={setTitle}
                placeholder="Enter note title"
                editable={!isLoading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Content</Text>
              <Textarea
                value={content}
                onChangeText={setContent}
                placeholder="Write your note here..."
                editable={!isLoading}
                style={styles.textarea}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="destructive"
            onPress={handleDelete}
            disabled={isLoading}
            style={styles.deleteButton}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
          <Button
            variant="outline"
            onPress={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleUpdate}
            disabled={isLoading}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#000',
  },
  textarea: {
    minHeight: 120,
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
  },
  deleteButton: {
    flex: 0.5,
  },
});
