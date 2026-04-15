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

export default function NoteCreateScreen() {
  const router = useRouter();
  const { workspaceId: workspaceIdParam } = useLocalSearchParams();
  const workspaceId = parseInt(workspaceIdParam as string, 10);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { createNote, isCreating } = useNotes(workspaceId);

  const handleCreate = async () => {
    setError(null);

    // Validate
    const validation = validateNote(title, content);
    if (!validation.valid) {
      setError(validation.message || 'Invalid note');
      return;
    }

    try {
      await createNote({
        title,
        content,
        workspaceId,
      });

      // Success - navigate back
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      setError(message);
      Alert.alert('Error', message);
    }
  };

  return (
    <LinearGradient {...GradientConfig} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>New Note</Text>
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
                editable={!isCreating}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Content</Text>
              <Textarea
                value={content}
                onChangeText={setContent}
                placeholder="Write your note here..."
                editable={!isCreating}
                style={styles.textarea}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={() => router.back()}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? 'Creating...' : 'Create Note'}
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopColor: '#e5e7eb',
    borderTopWidth: 1,
  },
});
