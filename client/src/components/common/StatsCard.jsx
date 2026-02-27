const StatsCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = 'blue',
  className = '',
}) => {
  const getTrendColor = () => {
    if (!trend) return '';
    return trend === 'up' ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    return trend === 'up' ? (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    );
  };

  const colorStyles = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  };

  return (
    <div className={`rounded-xl p-6 shadow-sm hover:shadow-md transition-all bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span className={`flex items-center gap-0.5 text-sm font-medium ${getTrendColor()}`}>
                  {getTrendIcon()}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl ${colorStyles[color] || colorStyles.blue}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
