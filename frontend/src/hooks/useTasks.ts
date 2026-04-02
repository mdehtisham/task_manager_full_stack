import { useState, useEffect, useCallback } from 'react';
import { Task, PaginationMeta, TaskFilters } from '../types';
import { tasksApi } from '../api/client';

const DEFAULT_FILTERS: TaskFilters = {
  status: '',
  priority: '',
  search: '',
  sortBy: 'created_at',
  order: 'desc',
  page: 1,
  limit: 10,
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Build clean params (exclude empty strings)
      const params: Record<string, string | number> = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.order) params.order = filters.order;
      params.page = filters.page;
      params.limit = filters.limit;

      const res = await tasksApi.list(params as Partial<TaskFilters>);
      setTasks(res.data.data);
      setMeta(res.data.meta);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to load tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const updateFilters = (updates: Partial<TaskFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: updates.page ?? 1 }));
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return {
    tasks,
    meta,
    filters,
    isLoading,
    error,
    updateFilters,
    updateTask,
    removeTask,
    refetch: fetchTasks,
  };
}
