import { useState, useRef, FormEvent } from 'react';
import { Task, User } from '../types';
import { validateTitle, validateDescription, validateDueDate } from '../utils/validation';

interface TaskFormValues {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  due_date: string;
  assigned_to: string;
}

interface TaskFormProps {
  initialValues?: Partial<TaskFormValues>;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  isLoading: boolean;
  serverErrors: Record<string, string>;
  users: User[];
  submitLabel?: string;
}

export function TaskForm({
  initialValues,
  onSubmit,
  isLoading,
  serverErrors,
  users,
  submitLabel = 'Save Task',
}: TaskFormProps) {
  const [values, setValues] = useState<TaskFormValues>({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    status: initialValues?.status || 'todo',
    priority: initialValues?.priority || 'medium',
    due_date: initialValues?.due_date || '',
    assigned_to: initialValues?.assigned_to || '',
  });
  const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
  const isSubmittingRef = useRef(false);

  const errors = { ...clientErrors, ...serverErrors };

  const set =
    (field: keyof TaskFormValues) =>
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      setClientErrors((prev) => ({ ...prev, [field]: '' }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isLoading) return;

    const newErrors: Record<string, string> = {};

    const titleErr = validateTitle(values.title);
    if (titleErr) newErrors.title = titleErr;

    const descErr = validateDescription(values.description);
    if (descErr) newErrors.description = descErr;

    const dateErr = validateDueDate(values.due_date);
    if (dateErr) newErrors.due_date = dateErr;

    if (Object.keys(newErrors).length > 0) {
      setClientErrors(newErrors);
      return;
    }

    isSubmittingRef.current = true;
    try {
      await onSubmit(values);
    } finally {
      isSubmittingRef.current = false;
    }
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[field] ? 'border-red-400' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
        <input
          type="text"
          value={values.title}
          onChange={set('title')}
          className={inputClass('title')}
          maxLength={200}
        />
        {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={values.description}
          onChange={set('description')}
          rows={4}
          className={inputClass('description')}
          maxLength={2000}
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select value={values.status} onChange={set('status')} className={inputClass('status')}>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
          <select
            value={values.priority}
            onChange={set('priority')}
            className={inputClass('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Due Date + Assigned To */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={values.due_date}
            onChange={set('due_date')}
            className={inputClass('due_date')}
          />
          {errors.due_date && <p className="mt-1 text-xs text-red-600">{errors.due_date}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
          <select
            value={values.assigned_to}
            onChange={set('assigned_to')}
            className={inputClass('assigned_to')}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {errors.assigned_to && (
            <p className="mt-1 text-xs text-red-600">{errors.assigned_to}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isLoading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}
