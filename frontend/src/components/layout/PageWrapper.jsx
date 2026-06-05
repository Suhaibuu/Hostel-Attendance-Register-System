export default function PageWrapper({ children, className = '' }) {
  return (
    <div
      className={[
        'min-h-screen bg-[var(--color-surface)] flex flex-col',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}
