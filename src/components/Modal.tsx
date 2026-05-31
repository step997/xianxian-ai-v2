import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Modal({ isOpen, title, children, footer, onClose }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 9000,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div className="animate-fade-in" onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 16, padding: 24,
        minWidth: 320, maxWidth: 480, width: '90%',
        boxShadow: 'var(--shadow)',
      }}>
        {title && (
          <h3 style={{ margin: '0 0 16px', fontSize: 18, color: 'var(--text)' }}>
            {title}
          </h3>
        )}
        <div style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
          {children}
        </div>
        {footer && (
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
