import { useIsMobile } from '../hooks/useIsMobile';

export function Page({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ padding: isMobile ? '16px 16px 24px' : 32 }}>
      {children}
    </div>
  );
}

interface Props {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}

export function FormField({ label, children, hint, required }: Props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
        {label}{required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
  color: '#e2e8f0', padding: '8px 10px', fontSize: 14, outline: 'none',
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} style={{ ...inputStyle, cursor: 'pointer', ...props.style }}>
      {props.children}
    </select>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
      {children}
    </div>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost';
}

export function Btn({ variant = 'primary', children, style, ...props }: BtnProps) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: '#0284c7', color: '#fff', border: 'none' },
    danger: { background: '#dc2626', color: '#fff', border: 'none' },
    ghost: { background: 'transparent', color: '#94a3b8', border: '1px solid #334155' },
  };
  return (
    <button
      {...props}
      style={{
        padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
        cursor: props.disabled ? 'not-allowed' : 'pointer', transition: 'opacity 0.15s',
        opacity: props.disabled ? 0.5 : 1,
        ...styles[variant],
        ...style,
      }}
    >
      {children}
    </button>
  );
}
