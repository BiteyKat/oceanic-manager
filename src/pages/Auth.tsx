import { useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'login' | 'signup';

export default function Auth() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setInfo('Account created! Check your email to confirm, then sign in.');
        setMode('login');
      }
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>✈</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.5px' }}>Oceanic</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Airline Manager</div>
        </div>

        {/* Card */}
        <div style={{
          background: '#1e293b', border: '1px solid #334155',
          borderRadius: 12, padding: 32,
        }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', marginBottom: 28, background: '#0f172a', borderRadius: 8, padding: 4 }}>
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setInfo(''); }}
                style={{
                  flex: 1, padding: '8px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, transition: 'all 0.15s',
                  background: mode === m ? '#1e293b' : 'transparent',
                  color: mode === m ? '#e2e8f0' : '#64748b',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.4)' : 'none',
                }}>
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                  padding: '10px 12px', color: '#e2e8f0', fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 6 }}>
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#0f172a', border: '1px solid #334155', borderRadius: 8,
                  padding: '10px 12px', color: '#e2e8f0', fontSize: 14,
                  outline: 'none',
                }}
              />
              {mode === 'signup' && (
                <p style={{ fontSize: 12, color: '#475569', marginTop: 6 }}>Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <div style={{
                background: '#2d1a1a', border: '1px solid #7f1d1d', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#fca5a5',
              }}>
                {error}
              </div>
            )}

            {info && (
              <div style={{
                background: '#0c2a1a', border: '1px solid #166534', borderRadius: 8,
                padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ade80',
              }}>
                {info}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '11px 0', border: 'none', borderRadius: 8,
                background: loading ? '#0c3a5a' : '#0284c7', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
