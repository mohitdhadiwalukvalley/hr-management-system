const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] theme-transition';

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'secondary':
        return {
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
        };
      case 'danger':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          boxShadow: 'var(--shadow-sm)',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--text-secondary)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-info)',
          border: '2px solid var(--color-info)',
        };
      default:
        return {};
    }
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const handleMouseEnter = (e) => {
    if (disabled || loading) return;
    if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
      e.currentTarget.style.color = 'var(--text-primary)';
    }
  };

  const handleMouseLeave = (e) => {
    if (variant === 'secondary') {
      e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
    } else if (variant === 'ghost') {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--text-secondary)';
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${baseStyles} ${sizes[size]} ${className}`}
      style={getVariantStyles()}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}
    </button>
  );
};

export default Button;