import { useState } from 'react';
import { useStore } from '../store';
import type { Hub, Gate } from '../types';
import Modal from '../components/Modal';
import { FormField, FormRow, Input, Btn, Page } from '../components/FormField';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Airports() {
  const { hubs, updateHub, deleteHub, ensureDefaultTerminal, addGate, updateGate, deleteGate } = useStore();
  const airports = hubs.filter((h) => h.isRouteAirport === true);
  const isMobile = useIsMobile();

  const [gateModal, setGateModal] = useState<{ hub: Hub; gate?: Gate } | null>(null);
  const [gateName, setGateName] = useState('');
  const [editModal, setEditModal] = useState<Hub | null>(null);
  const [editName, setEditName] = useState('');

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
        {airports.map((airport) => {
          const gates = allGates(airport);
          const assignedGates = gates.filter((g) => g.routeId).length;
          return (
            <div key={airport.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16 }}>
                <div style={{ background: '#0f2a1e', color: '#34d399', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, letterSpacing: 1, minWidth: 48, textAlign: 'center' }}>
                  {airport.iata}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{airport.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {airport.city}, {airport.country}
                    {airport.icao && <> · ICAO: {airport.icao}</>}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginRight: 8 }}>
                  {gates.length} gate{gates.length !== 1 ? 's' : ''}{gates.length > 0 ? ` (${assignedGates} assigned)` : ''}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openGate(airport)}>+ Gate</Btn>
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
        <Modal title="Edit Airport" onClose={() => setEditModal(null)}>
          <FormRow>
            <FormField label="Airport Name">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setEditModal(null)}>Cancel</Btn>
            <Btn onClick={() => { updateHub(editModal.id, { name: editName }); setEditModal(null); }} disabled={!editName.trim()}>Save</Btn>
          </div>
        </Modal>
      )}
    </Page>
  );
}
