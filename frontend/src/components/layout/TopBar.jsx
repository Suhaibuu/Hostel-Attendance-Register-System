export default function TopBar({ title, subtitle, rightContent }) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between
                 bg-[var(--color-card)] border-b border-[var(--color-border)]
                 shadow-sm px-4 h-[60px] shrink-0"
    >
      {/* Left — logo + title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain' }} className="shrink-0" />
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[var(--color-text-primary)] truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right — slot */}
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">{rightContent}</div>
      )}
    </header>
  );
}
