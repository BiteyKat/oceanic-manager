import { useState } from 'react';
import { useStore } from '../store';
import type { Hub, Slot, SlotType } from '../types';
import Modal from '../components/Modal';
import { FormField, FormRow, Input, Select, Btn } from '../components/FormField';

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'Europe/London',
  'Europe/Paris', 'Europe/Amsterdam', 'Europe/Frankfurt', 'Europe/Madrid', 'Europe/Rome',
  'Europe/Moscow', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Bangkok', 'Asia/Singapore',
  'Asia/Tokyo', 'Asia/Seoul', 'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
];

type HubForm = Omit<Hub, 'id' | 'terminals'>;
const emptyHub = (): HubForm => ({ name: '', iata: '', icao: '', city: '', country: '', timezone: 'UTC' });

export default function Hubs() {
  const { hubs, addHub, updateHub, deleteHub, addTerminal, deleteTerminal, addSlot, updateSlot, deleteSlot } = useStore();
  const [modal, setModal] = useState<null | 'addHub' | 'editHub'>(null);
  const [editingHub, setEditingHub] = useState<Hub | null>(null);
  const [form, setForm] = useState<HubForm>(emptyHub());
  const [expandedHub, setExpandedHub] = useState<string | null>(null);
  const [terminalName, setTerminalName] = useState('');
  const [addingTerminalFor, setAddingTerminalFor] = useState<string | null>(null);
  const [slotModal, setSlotModal] = useState<{ hubId: string; terminalId: string; slot?: Slot } | null>(null);
  const [slotForm, setSlotForm] = useState<{ time: string; type: SlotType }>({ time: '08:00', type: 'both' });

  const openAdd = () => { setForm(emptyHub()); setModal('addHub'); };
  const openEdit = (hub: Hub) => {
    setEditingHub(hub);
    setForm({ name: hub.name, iata: hub.iata, icao: hub.icao, city: hub.city, country: hub.country, timezone: hub.timezone });
    setModal('editHub');
  };

  const saveHub = () => {
    if (!form.name || !form.iata) return;
    if (modal === 'addHub') addHub({ ...form, iata: form.iata.toUpperCase(), icao: form.icao.toUpperCase() });
    else if (editingHub) updateHub(editingHub.id, { ...form, iata: form.iata.toUpperCase(), icao: form.icao.toUpperCase() });
    setModal(null);
  };

  const openSlot = (hubId: string, terminalId: string, slot?: Slot) => {
    setSlotModal({ hubId, terminalId, slot });
    setSlotForm(slot ? { time: slot.time, type: slot.type } : { time: '08:00', type: 'both' });
  };

  const saveSlot = () => {
    if (!slotModal) return;
    if (slotModal.slot) updateSlot(slotModal.hubId, slotModal.terminalId, slotModal.slot.id, slotForm);
    else addSlot(slotModal.hubId, slotModal.terminalId, slotForm);
    setSlotModal(null);
  };

  const f = (field: keyof HubForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Hubs</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Manage airport hubs, terminals, and slots</p>
        </div>
        <Btn onClick={openAdd}>+ Add Hub</Btn>
      </div>

      {hubs.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🏢</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>No hubs yet. Add your first hub.</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {hubs.map((hub) => {
          const isExpanded = expandedHub === hub.id;
          const totalSlots = hub.terminals.flatMap((t) => t.slots).length;
          const assignedSlots = hub.terminals.flatMap((t) => t.slots.filter((s) => s.routeId)).length;
          return (
            <div key={hub.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16 }}>
                <div style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 6, padding: '4px 10px', fontSize: 14, fontWeight: 700, letterSpacing: 1, minWidth: 48, textAlign: 'center' }}>
                  {hub.iata}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0' }}>{hub.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {hub.city}, {hub.country} · ICAO: {hub.icao} · {hub.timezone}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#64748b', marginRight: 8 }}>
                  <span>{hub.terminals.length} terminal{hub.terminals.length !== 1 ? 's' : ''}</span>
                  <span>{totalSlots} slots ({assignedSlots} assigned)</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(hub)}>Edit</Btn>
                  <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setExpandedHub(isExpanded ? null : hub.id)}>
                    {isExpanded ? 'Collapse' : 'Terminals ▾'}
                  </Btn>
                  <Btn variant="danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => deleteHub(hub.id)}>Delete</Btn>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid #334155', padding: '16px 20px', background: '#162032' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8' }}>Terminals</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {addingTerminalFor === hub.id ? (
                        <>
                          <Input
                            placeholder="Terminal name"
                            value={terminalName}
                            onChange={(e) => setTerminalName(e.target.value)}
                            style={{ width: 180, padding: '5px 8px', fontSize: 13 }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && terminalName.trim()) {
                                addTerminal(hub.id, terminalName.trim());
                                setTerminalName('');
                                setAddingTerminalFor(null);
                              }
                            }}
                          />
                          <Btn onClick={() => { if (terminalName.trim()) { addTerminal(hub.id, terminalName.trim()); setTerminalName(''); setAddingTerminalFor(null); } }} style={{ padding: '5px 10px', fontSize: 12 }}>Save</Btn>
                          <Btn variant="ghost" onClick={() => setAddingTerminalFor(null)} style={{ padding: '5px 10px', fontSize: 12 }}>Cancel</Btn>
                        </>
                      ) : (
                        <Btn style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => { setAddingTerminalFor(hub.id); setTerminalName(''); }}>+ Terminal</Btn>
                      )}
                    </div>
                  </div>

                  {hub.terminals.length === 0 && (
                    <p style={{ color: '#475569', fontSize: 13 }}>No terminals. Add one above.</p>
                  )}

                  {hub.terminals.map((terminal) => (
                    <div key={terminal.id} style={{ marginBottom: 16, background: '#1e293b', borderRadius: 8, overflow: 'hidden', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #334155' }}>
                        <span style={{ fontWeight: 600, color: '#e2e8f0', flex: 1 }}>{terminal.name}</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <Btn style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => openSlot(hub.id, terminal.id)}>+ Slot</Btn>
                          <Btn variant="danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => deleteTerminal(hub.id, terminal.id)}>Remove</Btn>
                        </div>
                      </div>
                      {terminal.slots.length === 0 && (
                        <p style={{ padding: '8px 14px', color: '#475569', fontSize: 12 }}>No slots assigned</p>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: terminal.slots.length ? '10px 14px' : 0 }}>
                        {terminal.slots
                          .slice()
                          .sort((a, b) => a.time.localeCompare(b.time))
                          .map((slot) => (
                            <div key={slot.id} style={{
                              background: slot.routeId ? '#0c4a6e' : '#0f172a',
                              border: `1px solid ${slot.routeId ? '#0369a1' : '#334155'}`,
                              borderRadius: 6, padding: '4px 10px', fontSize: 12,
                              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                            }} onClick={() => openSlot(hub.id, terminal.id, slot)}>
                              <span style={{ color: slot.routeId ? '#38bdf8' : '#94a3b8', fontWeight: 600 }}>{slot.time}</span>
                              <span style={{
                                color: slot.type === 'departure' ? '#4ade80' : slot.type === 'arrival' ? '#f59e0b' : '#a78bfa',
                                fontSize: 10,
                              }}>
                                {slot.type === 'departure' ? 'DEP' : slot.type === 'arrival' ? 'ARR' : 'B'}
                              </span>
                              {slot.routeId && <span style={{ color: '#38bdf8', fontSize: 10 }}>●</span>}
                              <button onClick={(e) => { e.stopPropagation(); deleteSlot(hub.id, terminal.id, slot.id); }} style={{
                                background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px',
                              }}>×</button>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(modal === 'addHub' || modal === 'editHub') && (
        <Modal title={modal === 'addHub' ? 'Add Hub' : 'Edit Hub'} onClose={() => setModal(null)}>
          <FormRow>
            <FormField label="Hub Name" required>
              <Input placeholder="e.g. London Heathrow" value={form.name} onChange={f('name')} />
            </FormField>
            <FormField label="IATA Code" required>
              <Input placeholder="e.g. LHR" maxLength={3} value={form.iata} onChange={f('iata')} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="ICAO Code">
              <Input placeholder="e.g. EGLL" maxLength={4} value={form.icao} onChange={f('icao')} />
            </FormField>
            <FormField label="Timezone">
              <Select value={form.timezone} onChange={f('timezone')}>
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </Select>
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="City">
              <Input placeholder="e.g. London" value={form.city} onChange={f('city')} />
            </FormField>
            <FormField label="Country">
              <Input placeholder="e.g. United Kingdom" value={form.country} onChange={f('country')} />
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveHub} disabled={!form.name || !form.iata}>Save Hub</Btn>
          </div>
        </Modal>
      )}

      {slotModal && (
        <Modal title={slotModal.slot ? 'Edit Slot' : 'Add Slot'} onClose={() => setSlotModal(null)} width={360}>
          <FormField label="Time (HH:MM)" required>
            <Input type="time" value={slotForm.time} onChange={(e) => setSlotForm((p) => ({ ...p, time: e.target.value }))} />
          </FormField>
          <FormField label="Slot Type">
            <Select value={slotForm.type} onChange={(e) => setSlotForm((p) => ({ ...p, type: e.target.value as SlotType }))}>
              <option value="both">Both (Dep + Arr)</option>
              <option value="departure">Departure only</option>
              <option value="arrival">Arrival only</option>
            </Select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setSlotModal(null)}>Cancel</Btn>
            <Btn onClick={saveSlot}>Save Slot</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
