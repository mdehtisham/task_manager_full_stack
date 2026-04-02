export function TableSkeleton() {
  return (
    <div className="animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="border-b border-gray-200 py-4 flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/6"></div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-full"></div>
      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}
