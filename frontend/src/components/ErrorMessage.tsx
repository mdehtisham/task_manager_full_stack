interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="rounded-md bg-red-50 p-4 border border-red-200">
      <div className="flex items-center justify-between">
        <p className="text-sm text-red-700">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-4 text-sm text-red-600 underline hover:text-red-800"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
