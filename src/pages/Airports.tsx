import { useState } from 'react';
import { useStore } from '../store';
import type { Hub, Gate } from '../types';
import Modal from '../components/Modal';
import { FormField, Input, Select, Btn, Page } from '../components/FormField';
import { useIsMobile } from '../hooks/useIsMobile';
import { findAirport, AIRPORT_TIMEZONES } from '../data/airports';

const TIMEZONES = ['UTC', ...AIRPORT_TIMEZONES];

export default function Airports() {
  const { hubs, updateHub, deleteHub, ensureDefaultTerminal, addGate, updateGate, deleteGate } = useStore();
  const airports = hubs.filter((h) => h.isRouteAirport === true);
  const isMobile = useIsMobile();

  const [search, setSearch] = useState('');
  const [gateModal, setGateModal] = useState<{ hub: Hub; gate?: Gate } | null>(null);
  const [gateName, setGateName] = useState('');
  const [editModal, setEditModal] = useState<Hub | null>(null);
  const [editName, setEditName] = useState('');
  const [editTimezone, setEditTimezone] = useState('UTC');

  const allGates = (hub: Hub) => hub.terminals.flatMap((t) => t.gates);

  const openGate = (hub: Hub, gate?: Gate) => {
    setGateModal({ hub, gate });
    setGateName(gate?.name ?? '');
  };

  const saveGate = () => {
    if (!gateModal || !gateName.trim()) return;
    if (gateModal.gate) {
      updateGate(gateModal.hub.id, gateModal.gate.terminalId, gateModal.gate.id, gateName.trim());
    } else {
      const termId = ensureDefaultTerminal(gateModal.hub.id);
      addGate(gateModal.hub.id, termId, gateName.trim());
    }
    setGateModal(null);
  };

  const openEdit = (hub: Hub) => {
    setEditModal(hub);
    setEditName(hub.name);
    // Auto-suggest correct timezone from airport database if currently UTC
    const record = findAirport(hub.iata);
    setEditTimezone(hub.timezone && hub.timezone !== 'UTC' ? hub.timezone : (record?.timezone ?? hub.timezone ?? 'UTC'));
  };

  const saveEdit = () => {
    if (!editModal || !editName.trim()) return;
    updateHub(editModal.id, { name: editName.trim(), timezone: editTimezone });
    setEditModal(null);
  };

  const promoteToHub = (hub: Hub) => {
    updateHub(hub.id, { isRouteAirport: false });
  };

  return (
    <Page>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Route Airports</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>
            Destination airports added when creating routes — manage their gates here
          </p>
        </div>
      </div>

      {airports.length > 0 && (
        <input
          placeholder="Search airports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', marginBottom: 16,
            background: '#0f172a', border: '1px solid #334155', borderRadius: 6,
            color: '#e2e8f0', padding: '7px 10px', fontSize: 13, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      )}

      {airports.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🗺️</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>No route airports yet.</p>
          <p style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>
            When you create a route using a non-hub airport, it will appear here.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {airports.filter((a) => {
          const q = search.trim().toLowerCase();
          if (!q) return true;
          return a.iata.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.city.toLowerCase().includes(q) || a.country.toLowerCase().includes(q);
        }).map((airport) => {
          const gates = allGates(airport);
          const assignedGates = gates.filter((g) => g.routeId).length;
          return (
            <div key={airport.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', padding: '14px 20px', gap: isMobile ? 10 : 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <div style={{ background: '#0f2a1e', color: '#34d399', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, letterSpacing: 1, minWidth: 48, textAlign: 'center', flexShrink: 0 }}>
                    {airport.iata}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{airport.name}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                      {airport.city}, {airport.country}
                      {airport.icao && <> · ICAO: {airport.icao}</>}
                      {' · '}{airport.timezone}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginLeft: 'auto', flexShrink: 0 }}>
                    {gates.length} gate{gates.length !== 1 ? 's' : ''}{gates.length > 0 ? ` (${assignedGates} assigned)` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', width: isMobile ? '100%' : 'auto' }}>
                  <Btn style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openGate(airport)}>+ Gate</Btn>
                  <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(airport)}>Edit</Btn>
                  <Btn
                    variant="ghost"
                    style={{ padding: '5px 10px', fontSize: 12 }}
                    title="Move this airport to the Hubs tab for full terminal management"
                    onClick={() => promoteToHub(airport)}
                  >
                    Promote to Hub
                  </Btn>
                  <Btn variant="danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => deleteHub(airport.id)}>Delete</Btn>
                </div>
              </div>

              {gates.length > 0 && (
                <div style={{ borderTop: '1px solid #2d3f55', padding: '10px 20px', background: '#162032' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {gates
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
                      .map((gate) => (
                        <div key={gate.id} style={{
                          background: gate.routeId ? '#0c4a6e' : '#0f172a',
                          border: `1px solid ${gate.routeId ? '#0369a1' : '#334155'}`,
                          borderRadius: 6, padding: '4px 10px', fontSize: 12,
                          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                        }} onClick={() => openGate(airport, gate)}>
                          <span style={{ color: gate.routeId ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>{gate.name}</span>
                          {gate.routeId && <span style={{ color: '#38bdf8', fontSize: 10 }}>●</span>}
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteGate(airport.id, gate.terminalId, gate.id); }}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}
                          >×</button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {gateModal && (
        <Modal title={gateModal.gate ? 'Edit Gate' : `Add Gate — ${gateModal.hub.iata}`} onClose={() => setGateModal(null)} width={340}>
          <FormField label="Gate Name" required hint='e.g. "A1", "Gate 12", "B32"'>
            <Input
              placeholder="e.g. A1"
              value={gateName}
              onChange={(e) => setGateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') saveGate(); }}
              autoFocus
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setGateModal(null)}>Cancel</Btn>
            <Btn onClick={saveGate} disabled={!gateName.trim()}>Save Gate</Btn>
          </div>
        </Modal>
      )}

      {editModal && (
        <Modal title={`Edit — ${editModal.iata}`} onClose={() => setEditModal(null)}>
          <FormField label="Airport Name" required>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </FormField>
          <FormField label="Timezone">
            <Select value={editTimezone} onChange={(e) => setEditTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setEditModal(null)}>Cancel</Btn>
            <Btn onClick={saveEdit} disabled={!editName.trim()}>Save</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
}
