import { useState } from 'react';
import { useStore } from '../store';
import type { Aircraft } from '../types';
import Modal from '../components/Modal';
import { FormField, FormRow, Input, Select, Btn } from '../components/FormField';

type AcForm = Omit<Aircraft, 'id'>;
const emptyAc = (): AcForm => ({ registration: '', typeId: '', name: '', hubId: undefined, routeId: undefined, status: 'available' });

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  available: { bg: '#14532d', color: '#4ade80' },
  assigned: { bg: '#1e3a5f', color: '#60a5fa' },
  maintenance: { bg: '#3b1515', color: '#f87171' },
};

export default function Fleet() {
  const { aircraft, aircraftTypes, hubs, routes, addAircraft, updateAircraft, deleteAircraft, assignAircraftToHub } = useStore();
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'assign'>(null);
  const [editing, setEditing] = useState<Aircraft | null>(null);
  const [form, setForm] = useState<AcForm>(emptyAc());
  const [assignHubId, setAssignHubId] = useState('');
  const [filterHub, setFilterHub] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const openAdd = () => { setForm(emptyAc()); setModal('add'); };
  const openEdit = (a: Aircraft) => { setEditing(a); setForm({ ...a }); setModal('edit'); };
  const openAssign = (a: Aircraft) => { setEditing(a); setAssignHubId(a.hubId ?? ''); setModal('assign'); };

  const saveAircraft = () => {
    if (!form.registration || !form.typeId) return;
    if (modal === 'add') addAircraft(form);
    else if (editing) updateAircraft(editing.id, form);
    setModal(null);
  };

  const doAssign = () => {
    if (!editing) return;
    assignAircraftToHub(editing.id, assignHubId);
    setModal(null);
  };

  const f = (field: keyof AcForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value || undefined }));

  const displayed = aircraft.filter((a) => {
    if (filterHub && a.hubId !== filterHub) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Fleet</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Manage aircraft and hub assignments</p>
        </div>
        <Btn onClick={openAdd}>+ Add Aircraft</Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Select value={filterHub} onChange={(e) => setFilterHub(e.target.value)} style={{ width: 180 }}>
          <option value="">All Hubs</option>
          {hubs.map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
          <option value="__none__">Unassigned</option>
        </Select>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 160 }}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="assigned">Assigned</option>
          <option value="maintenance">Maintenance</option>
        </Select>
      </div>

      {aircraft.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>✈</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>No aircraft yet. Add your first aircraft.</p>
        </div>
      )}

      {displayed.length > 0 && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                {['Registration', 'Name', 'Type', 'Category', 'Pax', 'Range', 'Hub', 'Route', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayed.map((ac) => {
                const type = aircraftTypes.find((t) => t.id === ac.typeId);
                const hub = hubs.find((h) => h.id === ac.hubId);
                const flight = ac.routeId ? routes.flatMap((r) => r.flights).find((f) => f.id === ac.routeId) : undefined;
                const sc = STATUS_COLORS[ac.status];
                return (
                  <tr key={ac.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{ac.registration}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{ac.name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{type ? `${type.manufacturer} ${type.model}` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: '#94a3b8', textTransform: 'capitalize' }}>{type?.category ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{type?.paxCapacity ?? '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{type ? `${type.rangeKm.toLocaleString()} km` : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>
                      {hub ? <span style={{ color: '#38bdf8', fontWeight: 600 }}>{hub.iata}</span> : <span style={{ color: '#475569' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>{flight?.flightNumber ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                        {ac.status}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <Btn variant="ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => openAssign(ac)}>Hub</Btn>
                        <Btn variant="ghost" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => openEdit(ac)}>Edit</Btn>
                        <Btn variant="danger" style={{ padding: '3px 8px', fontSize: 11 }} onClick={() => deleteAircraft(ac.id)}>×</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Aircraft' : 'Edit Aircraft'} onClose={() => setModal(null)}>
          <FormRow>
            <FormField label="Registration" required>
              <Input placeholder="e.g. G-TUIC" value={form.registration} onChange={(e) => setForm((p) => ({ ...p, registration: e.target.value.toUpperCase() }))} />
            </FormField>
            <FormField label="Name / Livery">
              <Input placeholder="e.g. City of London" value={form.name ?? ''} onChange={f('name')} />
            </FormField>
          </FormRow>
          <FormField label="Aircraft Type" required>
            <Select value={form.typeId} onChange={f('typeId')}>
              <option value="">Select type…</option>
              {['narrowbody', 'widebody', 'regional', 'turboprop'].map((cat) => (
                <optgroup key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                  {aircraftTypes.filter((t) => t.category === cat).map((t) => (
                    <option key={t.id} value={t.id}>{t.manufacturer} {t.model} · {t.paxCapacity} pax · {t.rangeKm.toLocaleString()} km</option>
                  ))}
                </optgroup>
              ))}
            </Select>
          </FormField>
          <FormRow>
            <FormField label="Status">
              <Select value={form.status} onChange={f('status')}>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
              </Select>
            </FormField>
            <FormField label="Base Hub">
              <Select value={form.hubId ?? ''} onChange={f('hubId')}>
                <option value="">No hub assigned</option>
                {hubs.map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
              </Select>
            </FormField>
          </FormRow>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveAircraft} disabled={!form.registration || !form.typeId}>Save</Btn>
          </div>
        </Modal>
      )}

      {modal === 'assign' && editing && (
        <Modal title="Assign to Hub" onClose={() => setModal(null)} width={380}>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
            Aircraft: <strong style={{ color: '#e2e8f0' }}>{editing.registration}</strong>
          </p>
          <FormField label="Hub">
            <Select value={assignHubId} onChange={(e) => setAssignHubId(e.target.value)}>
              <option value="">Unassign from hub</option>
              {hubs.map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
            </Select>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doAssign}>Assign</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
