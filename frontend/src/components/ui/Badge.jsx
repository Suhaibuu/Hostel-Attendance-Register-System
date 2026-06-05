const variantStyles = {
  present:
    'bg-[var(--color-success-light)] text-[var(--color-success)]',
  absent:
    'bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  pending:
    'bg-[var(--color-warning-light)] text-[var(--color-warning)]',
  info:
    'bg-[var(--color-primary-light)] text-[var(--color-primary)]',
};

export default function Badge({ children, variant = 'info' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full text-xs font-semibold px-2.5 py-0.5',
        variantStyles[variant] || variantStyles.info,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
