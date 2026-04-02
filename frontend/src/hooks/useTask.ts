import { useState, useEffect } from 'react';
import { Task } from '../types';
import { tasksApi } from '../api/client';

export function useTask(id: string) {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    tasksApi
      .get(id)
      .then((res) => setTask(res.data.data))
      .catch((err) => {
        const e = err as { response?: { data?: { error?: string } } };
        setError(e.response?.data?.error || 'Failed to load task');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  return { task, setTask, isLoading, error };
}
