import { useEffect } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';

interface Props {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export default function Modal({ title, onClose, children, width = 520 }: Props) {
  const isMobile = useIsMobile();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#1e293b', border: '1px solid #334155',
        borderRadius: isMobile ? '16px 16px 0 0' : 12,
        width: '100%', maxWidth: isMobile ? '100%' : width,
        maxHeight: isMobile ? '92vh' : '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '1px solid #334155',
          position: 'sticky', top: 0, background: '#1e293b', zIndex: 1,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0' }}>{title}</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
            fontSize: 20, lineHeight: 1, padding: '0 4px',
          }}>×</button>
        </div>
        <div style={{ padding: isMobile ? '16px' : '20px' }}>{children}</div>
      </div>
    </div>
  );
}
