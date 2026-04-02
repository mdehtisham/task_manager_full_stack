import { useState, useEffect, useRef } from 'react';
import { TaskFilters } from '../types';

interface TaskFiltersProps {
  filters: TaskFilters;
  onFilterChange: (updates: Partial<TaskFilters>) => void;
}

export function TaskFiltersBar({ filters, onFilterChange }: TaskFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search);

  // Keep a stable ref to onFilterChange so the debounce effect never needs it as a dep
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  const isFirstRender = useRef(true);

  // Debounce: fire onFilterChange 300ms after the user stops typing
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      onFilterChangeRef.current({ search: searchValue });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchValue]);

  // Sync local state when the parent clears search externally (e.g. filter reset)
  useEffect(() => {
    if (filters.search === '') setSearchValue('');
  }, [filters.search]);

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 min-w-48">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => setSearchValue('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 leading-none"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onFilterChange({ status: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Statuses</option>
        <option value="todo">To Do</option>
        <option value="in_progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority}
        onChange={(e) => onFilterChange({ priority: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">All Priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      {/* Sort */}
      <select
        value={filters.sortBy}
        onChange={(e) => onFilterChange({ sortBy: e.target.value })}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="created_at">Date Created</option>
        <option value="updated_at">Date Updated</option>
        <option value="due_date">Due Date</option>
        <option value="priority">Priority</option>
        <option value="title">Title</option>
        <option value="status">Status</option>
      </select>

      <button
        onClick={() => onFilterChange({ order: filters.order === 'asc' ? 'desc' : 'asc' })}
        className="px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50"
        title={`Sort ${filters.order === 'asc' ? 'descending' : 'ascending'}`}
      >
        {filters.order === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>
    </div>
  );
}
