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
    return trend === 'up' ? 'var(--color-success)' : 'var(--color-error)';
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

  const getIconBg = () => {
    const colors = {
      blue: 'rgba(99, 102, 241, 0.1)',
      emerald: 'rgba(16, 185, 129, 0.1)',
      amber: 'rgba(245, 158, 11, 0.1)',
      purple: 'rgba(139, 92, 246, 0.1)',
      red: 'rgba(239, 68, 68, 0.1)',
    };
    return colors[color] || colors.blue;
  };

  const getIconColor = () => {
    const colors = {
      blue: '#6366f1',
      emerald: '#10b981',
      amber: '#f59e0b',
      purple: '#8b5cf6',
      red: '#ef4444',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div
      className={`rounded-xl p-6 shadow-sm hover:shadow-md transition-all theme-transition ${className}`}
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{title}</p>
          <p className="mt-2 text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
          {(subtitle || trend) && (
            <div className="mt-2 flex items-center gap-2">
              {trend && (
                <span className="flex items-center gap-0.5 text-sm font-medium" style={{ color: getTrendColor() }}>
                  {getTrendIcon()}
                  {trendValue}
                </span>
              )}
              {subtitle && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: getIconBg(), color: getIconColor() }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;