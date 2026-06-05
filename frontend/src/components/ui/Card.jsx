const paddingStyles = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export default function Card({ children, className = '', padding = 'md' }) {
  return (
    <div
      className={[
        'bg-[var(--color-card)] rounded-2xl border border-slate-200',
        'shadow-sm hover:shadow-md transition-shadow duration-200',
        paddingStyles[padding] || paddingStyles.md,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
