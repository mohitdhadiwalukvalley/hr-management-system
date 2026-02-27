import { useTheme } from '../../context/ThemeContext';

const Badge = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = ''
}) => {
  const { isDark } = useTheme();

  const getVariantStyles = () => {
    const styles = {
      success: {
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
        color: isDark ? '#34d399' : '#047857',
        border: isDark ? 'rgba(16, 185, 129, 0.3)' : '#a7f3d0',
        dot: '#10b981'
      },
      warning: {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fef3c7',
        color: isDark ? '#fbbf24' : '#b45309',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a',
        dot: '#f59e0b'
      },
      error: {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
        color: isDark ? '#f87171' : '#b91c1c',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
        dot: '#ef4444'
      },
      info: {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#dbeafe',
        color: isDark ? '#60a5fa' : '#1d4ed8',
        border: isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe',
        dot: '#3b82f6'
      },
      neutral: {
        bg: isDark ? 'rgba(100, 116, 139, 0.15)' : '#f1f5f9',
        color: isDark ? '#94a3b8' : '#475569',
        border: isDark ? 'rgba(100, 116, 139, 0.3)' : '#e2e8f0',
        dot: '#64748b'
      },
      primary: {
        bg: isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff',
        color: isDark ? '#818cf8' : '#4338ca',
        border: isDark ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe',
        dot: '#6366f1'
      },
    };
    return styles[variant] || styles.neutral;
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  const variantStyles = getVariantStyles();

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border theme-transition
        ${sizes[size]}
        ${className}
      `}
      style={{
        backgroundColor: variantStyles.bg,
        color: variantStyles.color,
        borderColor: variantStyles.border,
      }}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: variantStyles.dot }}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;