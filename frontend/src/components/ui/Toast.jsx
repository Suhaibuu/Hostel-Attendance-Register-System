import { useEffect, useState } from 'react';

const typeStyles = {
  success: 'bg-[var(--color-success)] text-white',
  error: 'bg-[var(--color-danger)] text-white',
  info: 'bg-[var(--color-primary)] text-white',
};

const typeIcons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function Toast({ message, type = 'info', onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
    }, 2700);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (exiting) {
      const exitTimer = setTimeout(() => {
        onClose?.();
      }, 300);
      return () => clearTimeout(exitTimer);
    }
  }, [exiting, onClose]);

  return (
    <div
      className={[
        'fixed bottom-6 left-1/2 z-50',
        'flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-lg',
        'text-sm font-medium min-w-[260px] max-w-[90vw]',
        typeStyles[type] || typeStyles.info,
        exiting ? 'toast-exit' : 'toast-enter',
      ].join(' ')}
    >
      <span className="text-base leading-none">{typeIcons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => setExiting(true)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-base leading-none"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}
