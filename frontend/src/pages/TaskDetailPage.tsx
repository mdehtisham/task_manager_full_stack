import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useTask } from '../hooks/useTask';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Layout } from '../components/Layout';
import { tasksApi } from '../api/client';
import { Task } from '../types';

function StatusBadge({ status }: { status: Task['status'] }) {
  const styles: Record<Task['status'], string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };
  const labels: Record<Task['status'], string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done',
  };
  return (
    <span className={`px-3 py-1 text-sm rounded-full font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: Task['priority'] }) {
  const styles: Record<Task['priority'], string> = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 text-sm rounded-full font-medium capitalize ${styles[priority]}`}>
      {priority}
    </span>
  );
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const { task, isLoading, error } = useTask(id!);
  const { users } = useUsers();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const getUserName = (userId: string | null) => {
    if (!userId) return '—';
    return users.find((u) => u.id === userId)?.name || 'Unknown';
  };

  const canEditOrDelete = task
    ? isAdmin || task.created_by === user?.id
    : false;

  const handleDeleteConfirm = async () => {
    if (!task) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await tasksApi.delete(task.id);
      navigate('/tasks');
    } catch {
      setDeleteError('Failed to delete task. Please try again.');
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Layout>
      {/* Back button */}
      <div className="mb-6">
        <Link
          to="/tasks"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="mr-1">&#8592;</span> Tasks
        </Link>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <CardSkeleton />
        </div>
      ) : error ? (
        <ErrorMessage message={error} />
      ) : !task ? (
        <ErrorMessage message="Task not found." />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{task.title}</h1>
            {canEditOrDelete && (
              <div className="flex gap-2 shrink-0">
                <Link
                  to={`/tasks/${task.id}/edit`}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>

          {/* Description */}
          {task.description ? (
            <div>
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Description
              </h2>
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{task.description}</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">No description provided.</p>
          )}

          {/* Meta grid */}
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Due Date
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{formatDate(task.due_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assigned To
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{getUserName(task.assigned_to)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Created By
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{getUserName(task.created_by)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Created At
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{formatDateTime(task.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Last Updated
              </dt>
              <dd className="mt-1 text-sm text-gray-800">{formatDateTime(task.updated_at)}</dd>
            </div>
          </dl>

          {deleteError && (
            <div className="mt-2">
              <ErrorMessage message={deleteError} />
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Task"
        message={`Are you sure you want to delete "${task?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeleteError(null);
        }}
        isLoading={isDeleting}
      />
    </Layout>
  );
}
