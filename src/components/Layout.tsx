import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import { useAuth } from '../lib/auth';

const nav = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/hubs', label: 'Hubs', icon: '✈' },
  { to: '/airports', label: 'Airports', icon: '🗺' },
  { to: '/fleet', label: 'Fleet', icon: '🛩' },
  { to: '/routes', label: 'Routes', icon: '↗' },
];

export default function Layout() {
  const hubs = useStore((s) => s.hubs);
  const aircraft = useStore((s) => s.aircraft);
  const routes = useStore((s) => s.routes);
  const syncStatus = useStore((s) => s.syncStatus);
  const syncError = useStore((s) => s.syncError);
  const { user, signOut } = useAuth();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1e293b', borderRight: '1px solid #334155',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #334155' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.5px' }}>
            ✈ Oceanic
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Airline Manager</div>
        </div>
        <nav style={{ padding: '12px 8px', flex: 1 }}>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                borderRadius: 8, marginBottom: 2, textDecoration: 'none',
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? '#38bdf8' : '#94a3b8',
                background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid #334155', fontSize: 12, color: '#475569' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Hubs</span><span style={{ color: '#94a3b8' }}>{hubs.filter((h) => !h.isRouteAirport).length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Airports</span><span style={{ color: '#94a3b8' }}>{hubs.filter((h) => h.isRouteAirport).length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Aircraft</span><span style={{ color: '#94a3b8' }}>{aircraft.length}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Routes</span><span style={{ color: '#94a3b8' }}>{routes.length}</span>
          </div>
          <div style={{ marginTop: 8 }}>
            {syncStatus === 'saving' && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>⟳ Saving…</div>
            )}
            {syncStatus === 'saved' && (
              <div style={{ fontSize: 11, color: '#22c55e', marginBottom: 6 }}>✓ Saved</div>
            )}
            {syncStatus === 'error' && (
              <div style={{ fontSize: 11, color: '#f87171', marginBottom: 6 }} title={syncError ?? undefined}>
                ✕ Save failed
              </div>
            )}
          </div>
          <div style={{ paddingTop: 8, borderTop: '1px solid #1e293b' }}>
            <div style={{ color: '#475569', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
            <button
              onClick={signOut}
              style={{
                width: '100%', padding: '6px 0', background: 'transparent',
                border: '1px solid #334155', borderRadius: 6, color: '#64748b',
                fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = '#e2e8f0'; (e.target as HTMLButtonElement).style.borderColor = '#475569'; }}
              onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = '#64748b'; (e.target as HTMLButtonElement).style.borderColor = '#334155'; }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
        <Outlet />
      </main>
    </div>
  );
}
