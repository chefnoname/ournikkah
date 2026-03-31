import { api } from '@/services/api';
import type { ApiResult } from '@/types';
import { useCallback, useEffect, useState } from 'react';

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useApi<T>(endpoint: string): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const result: ApiResult<T> = await api.get<T>(endpoint);

    if (result.ok) {
      setData(result.data);
    } else {
      setError(result.error);
    }

    setIsLoading(false);
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, isLoading, refetch: fetchData };
}
