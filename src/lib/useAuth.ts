// Authentication hook
import { useCallback, useEffect, useState } from 'react';
import { api, toAbsoluteUrl } from './api';
import { clearGuestToken, fetchWithAuth } from './fetchWithAuth';
import type { User } from './types';

interface UseAuthResult {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const checkAuth = useCallback(async () => {
    if (isInitialized) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(toAbsoluteUrl(api.auth.me.path));
      if (res.status === 401) {
        setUser(null);
      } else if (!res.ok) {
        throw new Error('Failed to check authentication');
      } else {
        const userData = await res.json();
        setUser(userData);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      setUser(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(toAbsoluteUrl(api.auth.login.path), {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Login failed');
        }
        const userData = await res.json();
        setUser(userData);
        return userData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (email: string, password: string): Promise<User> => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetchWithAuth(toAbsoluteUrl(api.auth.register.path), {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Registration failed');
        }
        const userData = await res.json();
        setUser(userData);
        return userData;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await fetchWithAuth(toAbsoluteUrl(api.auth.logout.path), { method: 'POST' });
      setUser(null);
      await clearGuestToken();
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    checkAuth,
  };
}
