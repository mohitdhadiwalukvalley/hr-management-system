const Card = ({
  children,
  className = '',
  padding = 'default',
  hover = false,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    default: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`
        rounded-xl shadow-sm theme-transition
        ${hover ? 'hover:shadow-md transition-shadow duration-200' : ''}
        ${paddingClasses[padding]}
        ${className}
      `}
      style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-default)',
      }}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = '', action }) => (
  <div
    className={`flex items-center justify-between px-6 py-4 ${className}`}
    style={{ borderBottom: '1px solid var(--border-default)' }}
  >
    <div>{children}</div>
    {action && <div>{action}</div>}
  </div>
);

const CardTitle = ({ children, className = '' }) => (
  <h3 className={`text-lg font-semibold ${className}`} style={{ color: 'var(--text-primary)' }}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = '' }) => (
  <p className={`text-sm mt-1 ${className}`} style={{ color: 'var(--text-muted)' }}>
    {children}
  </p>
);

const CardBody = ({ children, className = '' }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '' }) => (
  <div
    className={`px-6 py-4 rounded-b-xl ${className}`}
    style={{
      borderTop: '1px solid var(--border-default)',
      backgroundColor: 'var(--bg-tertiary)'
    }}
  >
    {children}
  </div>
);

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;