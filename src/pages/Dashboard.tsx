import { useStore } from '../store';

function Stat({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div style={{
      background: '#1e293b', border: '1px solid #334155', borderRadius: 10,
      padding: '20px 24px',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#38bdf8' }}>{value}</div>
      <div style={{ fontSize: 14, color: '#e2e8f0', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const hubs = useStore((s) => s.hubs);
  const aircraft = useStore((s) => s.aircraft);
  const routes = useStore((s) => s.routes);
  const types = useStore((s) => s.aircraftTypes);

  const activeRoutes = routes.filter((r) => r.status === 'active').length;
  const assignedAc = aircraft.filter((a) => a.status === 'assigned').length;
  const availableAc = aircraft.filter((a) => a.status === 'available').length;
  const totalGates = hubs.flatMap((h) => h.terminals.flatMap((t) => t.gates)).length;
  const assignedGates = hubs.flatMap((h) => h.terminals.flatMap((t) => t.gates.filter((g) => g.routeId))).length;

  const routesByHub = hubs.map((h) => ({
    hub: h,
    departures: routes.filter((r) => r.originHubId === h.id).length,
    arrivals: routes.filter((r) => r.destinationHubId === h.id).length,
    fleet: aircraft.filter((a) => a.hubId === h.id).length,
  }));

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Airline operations overview</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Stat label="Hubs" value={hubs.length} />
        <Stat label="Fleet" value={aircraft.length} sub={`${assignedAc} assigned · ${availableAc} available`} />
        <Stat label="Routes" value={routes.length} sub={`${activeRoutes} active`} />
        <Stat label="Gates" value={totalGates} sub={`${assignedGates} assigned`} />
        <Stat label="Aircraft Types" value={types.length} />
      </div>

      {hubs.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginBottom: 14 }}>Hub Summary</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {routesByHub.map(({ hub, departures, arrivals, fleet }) => (
              <div key={hub.id} style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '16px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{
                    background: '#0c4a6e', color: '#38bdf8', borderRadius: 6,
                    padding: '4px 8px', fontSize: 13, fontWeight: 700, letterSpacing: 1,
                  }}>{hub.iata}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{hub.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{hub.city}, {hub.country}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { v: departures, l: 'Dep' },
                    { v: arrivals, l: 'Arr' },
                    { v: fleet, l: 'Fleet' },
                  ].map(({ v, l }) => (
                    <div key={l} style={{ background: '#0f172a', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#38bdf8' }}>{v}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {routes.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', marginTop: 32, marginBottom: 14 }}>Recent Routes</h2>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  {['Flight', 'Origin', 'Destination', 'Distance', 'Status', 'Aircraft'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 12, color: '#64748b', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {routes.slice(0, 10).map((r) => {
                  const origin = hubs.find((h) => h.id === r.originHubId);
                  const dest = hubs.find((h) => h.id === r.destinationHubId);
                  const ac = aircraft.find((a) => a.id === r.aircraftId);
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#e2e8f0', fontWeight: 600 }}>{r.flightNumber}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>{origin?.iata ?? '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>{dest?.iata ?? '—'}</td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>{r.distanceKm.toLocaleString()} km</td>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: r.status === 'active' ? '#14532d' : r.status === 'planned' ? '#1e3a5f' : '#3b1515',
                          color: r.status === 'active' ? '#4ade80' : r.status === 'planned' ? '#60a5fa' : '#f87171',
                        }}>{r.status}</span>
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#94a3b8' }}>{ac?.registration ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {hubs.length === 0 && (
        <div style={{
          marginTop: 48, textAlign: 'center', color: '#475569',
          border: '1px dashed #334155', borderRadius: 12, padding: 48,
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>✈</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>No airline yet</div>
          <div style={{ fontSize: 14 }}>Start by adding a hub from the Hubs page</div>
        </div>
      )}
    </div>
  );
}
