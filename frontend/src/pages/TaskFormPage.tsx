import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { TaskForm } from '../components/TaskForm';
import { useTask } from '../hooks/useTask';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { CardSkeleton } from '../components/LoadingSkeleton';
import { ErrorMessage } from '../components/ErrorMessage';
import { tasksApi } from '../api/client';
import { extractApiErrors, extractApiError } from '../utils/validation';
import { Task } from '../types';

interface TaskFormValues {
  title: string;
  description: string;
  status: Task['status'];
  priority: Task['priority'];
  due_date: string;
  assigned_to: string;
}

// Edit mode inner component — rendered only after task is loaded
function EditTaskForm({
  taskId,
  initialValues,
  users,
}: {
  taskId: string;
  initialValues: TaskFormValues;
  users: ReturnType<typeof useUsers>['users'];
}) {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  const handleSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    setServerErrors({});
    setGlobalError('');
    try {
      await tasksApi.update(taskId, {
        title: values.title.trim(),
        description: values.description.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assigned_to: values.assigned_to || null,
      });
      navigate(`/tasks/${taskId}`);
    } catch (err) {
      const fieldErrors = extractApiErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        setGlobalError(extractApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {globalError && (
        <div className="mb-4">
          <ErrorMessage message={globalError} />
        </div>
      )}
      <TaskForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        isLoading={isSubmitting}
        serverErrors={serverErrors}
        users={users}
        submitLabel="Save Changes"
      />
    </>
  );
}

export function TaskFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const isEditMode = Boolean(id);

  const { task, isLoading: taskLoading, error: taskError } = useTask(id || '');
  const { users } = useUsers();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState('');

  // Redirect if user has no permission to edit
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (isEditMode && task && !isAdmin && task.created_by !== user?.id) {
      setForbidden(true);
    }
  }, [isEditMode, task, isAdmin, user?.id]);

  const handleCreateSubmit = async (values: TaskFormValues) => {
    setIsSubmitting(true);
    setServerErrors({});
    setGlobalError('');
    try {
      const res = await tasksApi.create({
        title: values.title.trim(),
        description: values.description.trim() || null,
        status: values.status,
        priority: values.priority,
        due_date: values.due_date || null,
        assigned_to: values.assigned_to || null,
      });
      navigate(`/tasks/${res.data.data.id}`);
    } catch (err) {
      const fieldErrors = extractApiErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setServerErrors(fieldErrors);
      } else {
        setGlobalError(extractApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const pageTitle = isEditMode ? 'Edit Task' : 'New Task';

  // Derive initial values from loaded task for edit mode
  const editInitialValues: TaskFormValues | null =
    task
      ? {
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          due_date: task.due_date
            ? task.due_date.split('T')[0] // ensure YYYY-MM-DD format for <input type="date">
            : '',
          assigned_to: task.assigned_to || '',
        }
      : null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        {/* Back navigation */}
        <button
          onClick={() => navigate(isEditMode && id ? `/tasks/${id}` : '/tasks')}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <span className="mr-1">&#8592;</span>
          {isEditMode ? 'Back to Task' : 'Back to Tasks'}
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">{pageTitle}</h1>

        {/* Forbidden state */}
        {forbidden && (
          <ErrorMessage message="You do not have permission to edit this task." />
        )}

        {/* Edit mode loading / error */}
        {!forbidden && isEditMode && taskLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <CardSkeleton />
          </div>
        )}

        {!forbidden && isEditMode && taskError && (
          <ErrorMessage message={taskError} />
        )}

        {/* Edit mode form — rendered once task is loaded and user is authorized */}
        {!forbidden && isEditMode && !taskLoading && !taskError && editInitialValues && id && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <EditTaskForm taskId={id} initialValues={editInitialValues} users={users} />
          </div>
        )}

        {/* Create mode form */}
        {!isEditMode && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {globalError && (
              <div className="mb-4">
                <ErrorMessage message={globalError} />
              </div>
            )}
            <TaskForm
              onSubmit={handleCreateSubmit}
              isLoading={isSubmitting}
              serverErrors={serverErrors}
              users={users}
              submitLabel="Create Task"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}
