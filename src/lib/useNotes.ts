// Reusable hooks - cross-platform (Web & Mobile)
import { useCallback, useRef, useState } from 'react';
import { api, buildUrl, toAbsoluteUrl } from './api';
import { fetchWithAuth } from './fetchWithAuth';
import type { CreateNoteRequest, Note, UpdateNoteRequest } from './types';

interface UseNotesResult {
  notes: Note[] | undefined;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: Error | null;
  createNote: (data: CreateNoteRequest) => Promise<Note>;
  updateNote: (id: number, data: UpdateNoteRequest) => Promise<Note>;
  deleteNote: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotes(workspaceId: number): UseNotesResult {
  const [notes, setNotes] = useState<Note[] | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Use a ref to track fetched workspaceId to avoid duplicate fetches
  const fetchedWorkspaceId = useRef<number | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!workspaceId) return;

    setIsLoading(true);
    setError(null);
    try {
      const url = buildUrl(api.notes.list.path, { workspaceId });
      const res = await fetchWithAuth(toAbsoluteUrl(url));
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(data);
      fetchedWorkspaceId.current = workspaceId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      setNotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  // Auto-fetch on mount or workspaceId change
  // Using a simple ref check instead of useEffect to avoid issues with testing
  if (fetchedWorkspaceId.current !== workspaceId && workspaceId > 0) {
    // Only call if not already loading
    if (!isLoading) {
      fetchNotes();
    }
  }

  const createNote = useCallback(
    async (data: CreateNoteRequest): Promise<Note> => {
      setIsCreating(true);
      setError(null);
      try {
        const res = await fetchWithAuth(toAbsoluteUrl(api.notes.create.path), {
          method: 'POST',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to create note');
        }
        const newNote = await res.json();
        setNotes((prev) => [...(prev || []), newNote]);
        return newNote;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    []
  );

  const updateNote = useCallback(
    async (id: number, data: UpdateNoteRequest): Promise<Note> => {
      setIsUpdating(true);
      setError(null);
      try {
        const url = buildUrl(api.notes.update.path, { id });
        const res = await fetchWithAuth(toAbsoluteUrl(url), {
          method: 'PUT',
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Failed to update note');
        }
        const updatedNote = await res.json();
        setNotes((prev) =>
          prev ? prev.map((n) => (n.id === id ? updatedNote : n)) : undefined
        );
        return updatedNote;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsUpdating(false);
      }
    },
    []
  );

  const deleteNote = useCallback(async (id: number): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      const url = buildUrl(api.notes.delete.path, { id });
      const res = await fetchWithAuth(toAbsoluteUrl(url), {
        method: 'DELETE',
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete note');
      }
      setNotes((prev) => (prev ? prev.filter((n) => n.id !== id) : undefined));
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, []);

  const refresh = useCallback(() => {
    fetchedWorkspaceId.current = null;
    return fetchNotes();
  }, [fetchNotes]);

  return {
    notes,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    createNote,
    updateNote,
    deleteNote,
    refresh,
  };
}
