import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useState } from 'react';
import { api, buildUrl, toAbsoluteUrl } from './api';
import { fetchWithAuth, setGuestToken } from './fetchWithAuth';
import type { SummaryData, Workspace, WorkspaceMember } from './types';

const WORKSPACE_ID_KEY = 'workspaceId';

interface WorkspaceContextType {
  workspace: Workspace | null;
  workspaceId: number | null;
  summary: SummaryData | null;
  members: WorkspaceMember[];
  isLoading: boolean;
  setWorkspaceId: (id: number) => Promise<void>;
  fetchWorkspace: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchMembers: () => Promise<void>;
  startGuestSession: () => Promise<number>;
  saveOnboarding: (data: Record<string, any>) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceId, setWsId] = useState<number | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const setWorkspaceId = useCallback(async (id: number) => {
    setWsId(id);
    await AsyncStorage.setItem(WORKSPACE_ID_KEY, String(id));
  }, []);

  const fetchWorkspace = useCallback(async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.get.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) {
        setWorkspace(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch workspace:', e);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  const fetchSummary = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.summary.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) {
        setSummary(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch summary:', e);
    }
  }, [workspaceId]);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const url = toAbsoluteUrl(buildUrl(api.workspaces.members.path, { id: workspaceId }));
      const res = await fetchWithAuth(url);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch members:', e);
    }
  }, [workspaceId]);

  const startGuestSession = useCallback(async () => {
    const url = toAbsoluteUrl(api.guest.start.path);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to start planning');
    const data = await res.json();
    await setGuestToken(data.guestToken);
    const wsId = data.workspaceId;
    await setWorkspaceId(wsId);
    return wsId;
  }, [setWorkspaceId]);

  const saveOnboarding = useCallback(async (data: Record<string, any>) => {
    const url = toAbsoluteUrl(api.guest.onboarding.path);
    const res = await fetchWithAuth(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save onboarding data');
  }, []);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        workspaceId,
        summary,
        members,
        isLoading,
        setWorkspaceId,
        fetchWorkspace,
        fetchSummary,
        fetchMembers,
        startGuestSession,
        saveOnboarding,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

export async function getSavedWorkspaceId(): Promise<number | null> {
  const id = await AsyncStorage.getItem(WORKSPACE_ID_KEY);
  return id ? Number(id) : null;
}
