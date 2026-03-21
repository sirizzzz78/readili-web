import { type ReactNode, useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showHandle?: boolean;
}

export function Modal({ open, onClose, children, title, showHandle = true }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isWide, setIsWide] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth >= 640
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const handler = (e: MediaQueryListEvent) => setIsWide(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Focus trap
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const focusable = ref.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center modal-backdrop ${
        isWide ? 'items-center px-6' : 'items-end'
      }`}
      onClick={onClose}
    >
      <div
        ref={ref}
        className={`bg-[var(--background)] max-h-[90dvh] overflow-y-auto ${
          isWide
            ? 'w-full max-w-lg rounded-[20px] animate-fade-scale-in'
            : 'w-full max-w-lg rounded-t-[20px] transition-slide-up animate-slide-up'
        }`}
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {showHandle && !isWide && (
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-[var(--border)]" />
          </div>
        )}
        {title && (
          <div className="flex items-center justify-between" style={{ padding: '0.5rem var(--card-px) 1rem' }}>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="p-3 -m-1 rounded-full hover:bg-[var(--surface)]">
              <X size={18} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
