const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin text-blue-600 ${sizes[size]}`}
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

// Skeleton loader for tables
export const TableSkeleton = ({ rows = 5, cols = 4 }) => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded mb-2" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="flex gap-4 mb-2">
        {[...Array(cols)].map((_, j) => (
          <div key={j} className="h-10 bg-gray-100 rounded flex-1" />
        ))}
      </div>
    ))}
  </div>
);

// Card skeleton
export const CardSkeleton = () => (
  <div className="animate-pulse bg-white rounded-xl p-6 shadow-sm border border-gray-100">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-gray-100 rounded w-1/4" />
  </div>
);

export default LoadingSpinner;