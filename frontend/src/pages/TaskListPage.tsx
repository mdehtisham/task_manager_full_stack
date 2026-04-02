import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { useUsers } from '../hooks/useUsers';
import { TaskTable } from '../components/TaskTable';
import { TaskFiltersBar } from '../components/TaskFilters';
import { Pagination } from '../components/Pagination';
import { TableSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Layout } from '../components/Layout';
import { Task } from '../types';
import { tasksApi } from '../api/client';

export function TaskListPage() {
  const { tasks, meta, filters, isLoading, error, updateFilters, updateTask, removeTask, refetch } =
    useTasks();
  const { users } = useUsers();

  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleMarkDone = async (id: string) => {
    try {
      const res = await tasksApi.update(id, { status: 'done' });
      updateTask(id, res.data.data);
    } catch {
      // Silently fail — the row remains unchanged; user can retry
    }
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await tasksApi.delete(taskToDelete.id);
      removeTask(taskToDelete.id);
      setTaskToDelete(null);
    } catch {
      setDeleteError('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setTaskToDelete(null);
    setDeleteError(null);
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <Link
          to="/tasks/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + New Task
        </Link>
      </div>

      <TaskFiltersBar filters={filters} onFilterChange={updateFilters} />

      {deleteError && (
        <div className="mb-4">
          <ErrorMessage message={deleteError} />
        </div>
      )}

      {isLoading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorMessage message={error} onRetry={refetch} />
      ) : (
        <>
          <TaskTable
            tasks={tasks}
            users={users}
            onMarkDone={handleMarkDone}
            onDelete={handleDeleteClick}
          />
          <Pagination meta={meta} onPageChange={(page) => updateFilters({ page })} />
        </>
      )}

      <ConfirmDialog
        isOpen={taskToDelete !== null}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isLoading={isDeleting}
      />
    </Layout>
  );
}
