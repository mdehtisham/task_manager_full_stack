import { Link } from 'react-router-dom';
import { Task, User } from '../types';
import { useAuth } from '../context/AuthContext';

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
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${styles[status]}`}>
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
    <span className={`px-2 py-1 text-xs rounded-full font-medium capitalize ${styles[priority]}`}>
      {priority}
    </span>
  );
}

interface TaskTableProps {
  tasks: Task[];
  users: User[];
  onMarkDone: (id: string) => void;
  onDelete: (task: Task) => void;
}

export function TaskTable({ tasks, users, onMarkDone, onDelete }: TaskTableProps) {
  const { user, isAdmin } = useAuth();

  const getUserName = (id: string | null) => {
    if (!id) return '—';
    return users.find((u) => u.id === id)?.name || 'Unknown';
  };

  const canDelete = (task: Task) => isAdmin || task.created_by === user?.id;

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {['Title', 'Status', 'Priority', 'Due Date', 'Assigned To', 'Actions'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-gray-500 text-sm">
                No tasks found
              </td>
            </tr>
          ) : (
            tasks.map((task) => (
              <tr key={task.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="text-blue-600 hover:underline font-medium text-sm"
                  >
                    {task.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={task.status} />
                </td>
                <td className="px-4 py-3">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {getUserName(task.assigned_to)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 items-center">
                    {task.status !== 'done' && (
                      <button
                        onClick={() => onMarkDone(task.id)}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Done
                      </button>
                    )}
                    <Link
                      to={`/tasks/${task.id}/edit`}
                      className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </Link>
                    {canDelete(task) && (
                      <button
                        onClick={() => onDelete(task)}
                        className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
