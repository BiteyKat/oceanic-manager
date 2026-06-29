import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useStore } from '../store';
import { useAuth } from '../lib/auth';
import { useIsMobile } from '../hooks/useIsMobile';

const nav = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/hubs', label: 'Hubs', icon: '✈' },
  { to: '/airports', label: 'Airports', icon: '🗺' },
  { to: '/fleet', label: 'Fleet', icon: '🛩' },
  { to: '/routes', label: 'Routes', icon: '↗' },
];

const SYNC_LABEL: Record<string, string> = {
  saving: '⟳ Saving…',
  saved: '✓ Saved',
  error: '✕ Error',
};
const SYNC_COLOR: Record<string, string> = {
  saving: '#64748b',
  saved: '#22c55e',
  error: '#f87171',
};

export default function Layout() {
  const hubs = useStore((s) => s.hubs);
  const aircraft = useStore((s) => s.aircraft);
  const routes = useStore((s) => s.routes);
  const syncStatus = useStore((s) => s.syncStatus);
  const syncError = useStore((s) => s.syncError);
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarContent = (
    <>
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
            onClick={() => setDrawerOpen(false)}
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
          {syncStatus !== 'idle' && (
            <div style={{ fontSize: 11, color: SYNC_COLOR[syncStatus] ?? '#64748b', marginBottom: 6 }}
              title={syncStatus === 'error' ? (syncError ?? undefined) : undefined}>
              {SYNC_LABEL[syncStatus]}
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
    </>
  );

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Mobile top header */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: '#1e293b', borderBottom: '1px solid #334155',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', height: 52, flexShrink: 0,
        }}>
          <button
            onClick={() => setDrawerOpen(true)}
            style={{
              background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer',
              fontSize: 20, padding: '8px 8px 8px 0', lineHeight: 1,
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#38bdf8', letterSpacing: '-0.5px' }}>
            ✈ Oceanic
          </div>
          <div style={{ fontSize: 11, color: SYNC_COLOR[syncStatus] ?? 'transparent', minWidth: 60, textAlign: 'right' }}>
            {SYNC_LABEL[syncStatus] ?? ''}
          </div>
        </header>

        {/* Drawer overlay */}
        {drawerOpen && (
          <div
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
            }}
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Slide-in drawer */}
        <aside style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
          width: 240, background: '#1e293b', borderRight: '1px solid #334155',
          display: 'flex', flexDirection: 'column', flexShrink: 0,
          transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              position: 'absolute', top: 12, right: 12,
              background: 'none', border: 'none', color: '#64748b',
              cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 4,
            }}
            aria-label="Close menu"
          >
            ×
          </button>
          {sidebarContent}
        </aside>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
          <Outlet />
        </main>

        {/* Bottom tab bar */}
        <nav style={{
          position: 'sticky', bottom: 0, zIndex: 50,
          background: '#1e293b', borderTop: '1px solid #334155',
          display: 'flex', height: 60, flexShrink: 0,
        }}>
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', textDecoration: 'none', gap: 2,
                color: isActive ? '#38bdf8' : '#64748b',
                fontSize: 10, fontWeight: isActive ? 600 : 400,
                transition: 'color 0.15s',
                paddingBottom: 'env(safe-area-inset-bottom)',
              })}
            >
              <span style={{ fontSize: 18 }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1e293b', borderRight: '1px solid #334155',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
      }}>
        {sidebarContent}
      </aside>
      <main style={{ flex: 1, overflow: 'auto', background: '#0f172a' }}>
        <Outlet />
      </main>
    </div>
  );
}
