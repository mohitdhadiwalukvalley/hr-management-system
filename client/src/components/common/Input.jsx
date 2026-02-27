import { forwardRef } from 'react';

const Input = forwardRef(({
  label,
  type = 'text',
  error,
  helperText,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label
          className="block text-sm font-medium mb-1.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`
            w-full py-2.5 rounded-lg
            transition-all duration-200 theme-transition
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            ${error ? 'ring-2 ring-red-500' : ''}
            ${icon ? 'pl-10' : 'px-4'}
            ${!icon ? 'px-4' : 'pr-4'}
            ${className}
          `}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: `1px solid ${error ? 'var(--color-error)' : 'var(--border-default)'}`,
            color: 'var(--text-primary)',
          }}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm flex items-center gap-1" style={{ color: 'var(--color-error)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;