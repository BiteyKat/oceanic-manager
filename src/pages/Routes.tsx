import { useState } from 'react';
import { useStore } from '../store';
import type { Route, RouteStatus } from '../types';
import Modal from '../components/Modal';
import { FormField, FormRow, Input, Select, Btn } from '../components/FormField';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type RouteForm = Omit<Route, 'id'>;
const emptyRoute = (): RouteForm => ({
  flightNumber: '',
  originHubId: '',
  destinationHubId: '',
  aircraftId: undefined,
  departureSlotId: undefined,
  arrivalSlotId: undefined,
  distanceKm: 0,
  status: 'planned',
  daysOfOperation: [1, 2, 3, 4, 5],
});

const STATUS_COLORS: Record<RouteStatus, { bg: string; color: string }> = {
  active: { bg: '#14532d', color: '#4ade80' },
  planned: { bg: '#1e3a5f', color: '#60a5fa' },
  suspended: { bg: '#3b1515', color: '#f87171' },
};

export default function Routes() {
  const { routes, hubs, aircraft, aircraftTypes, addRoute, updateRoute, deleteRoute, assignAircraftToRoute, assignSlotsToRoute } = useStore();
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'assign'>(null);
  const [editing, setEditing] = useState<Route | null>(null);
  const [form, setForm] = useState<RouteForm>(emptyRoute());
  const [assignForm, setAssignForm] = useState<{ aircraftId: string; departureSlotId: string; arrivalSlotId: string }>({
    aircraftId: '', departureSlotId: '', arrivalSlotId: '',
  });
  const [filterStatus, setFilterStatus] = useState('');
  const [filterHub, setFilterHub] = useState('');

  const openAdd = () => { setForm(emptyRoute()); setModal('add'); };
  const openEdit = (r: Route) => { setEditing(r); setForm({ ...r }); setModal('edit'); };
  const openAssign = (r: Route) => {
    setEditing(r);
    setAssignForm({
      aircraftId: r.aircraftId ?? '',
      departureSlotId: r.departureSlotId ?? '',
      arrivalSlotId: r.arrivalSlotId ?? '',
    });
    setModal('assign');
  };

  const saveRoute = () => {
    if (!form.flightNumber || !form.originHubId || !form.destinationHubId) return;
    if (modal === 'add') addRoute(form);
    else if (editing) updateRoute(editing.id, form);
    setModal(null);
  };

  const doAssign = () => {
    if (!editing) return;
    assignAircraftToRoute(editing.id, assignForm.aircraftId || undefined);
    assignSlotsToRoute(editing.id, assignForm.departureSlotId || undefined, assignForm.arrivalSlotId || undefined);
    setModal(null);
  };

  const toggleDay = (d: number) => {
    setForm((p) => ({
      ...p,
      daysOfOperation: p.daysOfOperation.includes(d) ? p.daysOfOperation.filter((x) => x !== d) : [...p.daysOfOperation, d].sort(),
    }));
  };

  const displayed = routes.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterHub && r.originHubId !== filterHub && r.destinationHubId !== filterHub) return false;
    return true;
  });

  const assignOriginHub = editing ? hubs.find((h) => h.id === editing.originHubId) : null;
  const assignDestHub = editing ? hubs.find((h) => h.id === editing.destinationHubId) : null;

  const availableAc = aircraft.filter((a) =>
    a.status === 'available' || (editing && a.id === editing.aircraftId)
  );

  const depSlots = assignOriginHub?.terminals.flatMap((t) =>
    t.slots.filter((s) => (s.type === 'departure' || s.type === 'both') && (!s.routeId || s.routeId === editing?.id))
      .map((s) => ({ ...s, terminalName: t.name }))
  ) ?? [];

  const arrSlots = assignDestHub?.terminals.flatMap((t) =>
    t.slots.filter((s) => (s.type === 'arrival' || s.type === 'both') && (!s.routeId || s.routeId === editing?.id))
      .map((s) => ({ ...s, terminalName: t.name }))
  ) ?? [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Routes</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Create and manage flight routes with aircraft and slot assignments</p>
        </div>
        <Btn onClick={openAdd} disabled={hubs.length < 2}>
          {hubs.length < 2 ? 'Need 2+ hubs' : '+ Add Route'}
        </Btn>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ width: 160 }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="planned">Planned</option>
          <option value="suspended">Suspended</option>
        </Select>
        <Select value={filterHub} onChange={(e) => setFilterHub(e.target.value)} style={{ width: 200 }}>
          <option value="">All Hubs</option>
          {hubs.map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
        </Select>
      </div>

      {routes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>↗</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>No routes yet. {hubs.length < 2 ? 'Add at least two hubs first.' : 'Add your first route.'}</p>
        </div>
      )}

      {displayed.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {displayed.map((r) => {
            const origin = hubs.find((h) => h.id === r.originHubId);
            const dest = hubs.find((h) => h.id === r.destinationHubId);
            const ac = aircraft.find((a) => a.id === r.aircraftId);
            const acType = ac ? aircraftTypes.find((t) => t.id === ac.typeId) : null;
            const sc = STATUS_COLORS[r.status];

            const depSlotInfo = origin?.terminals.flatMap((t) => t.slots.filter((s) => s.id === r.departureSlotId).map((s) => ({ ...s, terminalName: t.name })))[0];
            const arrSlotInfo = dest?.terminals.flatMap((t) => t.slots.filter((s) => s.id === r.arrivalSlotId).map((s) => ({ ...s, terminalName: t.name })))[0];

            return (
              <div key={r.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{r.flightNumber}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>{r.status}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>{origin?.iata ?? '?'}</span>
                      <span style={{ color: '#475569', fontSize: 18 }}>→</span>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#38bdf8' }}>{dest?.iata ?? '?'}</span>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>{r.distanceKm.toLocaleString()} km</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                      <span style={{ color: '#64748b' }}>
                        Aircraft: <span style={{ color: ac ? '#94a3b8' : '#475569' }}>{ac ? `${ac.registration} (${acType?.model ?? '?'})` : 'Unassigned'}</span>
                      </span>
                      <span style={{ color: '#334155' }}>·</span>
                      <span style={{ color: '#64748b' }}>
                        Dep: <span style={{ color: depSlotInfo ? '#38bdf8' : '#475569' }}>{depSlotInfo ? `${depSlotInfo.time} – ${depSlotInfo.terminalName}` : 'No slot'}</span>
                      </span>
                      <span style={{ color: '#334155' }}>·</span>
                      <span style={{ color: '#64748b' }}>
                        Arr: <span style={{ color: arrSlotInfo ? '#38bdf8' : '#475569' }}>{arrSlotInfo ? `${arrSlotInfo.time} – ${arrSlotInfo.terminalName}` : 'No slot'}</span>
                      </span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 3 }}>
                      {DAYS.map((d, i) => (
                        <span key={d} style={{
                          fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                          background: r.daysOfOperation.includes(i) ? '#0c4a6e' : '#1e293b',
                          color: r.daysOfOperation.includes(i) ? '#38bdf8' : '#475569',
                          border: `1px solid ${r.daysOfOperation.includes(i) ? '#0369a1' : '#334155'}`,
                        }}>{d}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Btn style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openAssign(r)}>Assign</Btn>
                    <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEdit(r)}>Edit</Btn>
                    <Btn variant="danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => deleteRoute(r.id)}>×</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Route' : 'Edit Route'} onClose={() => setModal(null)} width={560}>
          <FormRow>
            <FormField label="Flight Number" required>
              <Input placeholder="e.g. OC101" value={form.flightNumber} onChange={(e) => setForm((p) => ({ ...p, flightNumber: e.target.value.toUpperCase() }))} />
            </FormField>
            <FormField label="Distance (km)" required>
              <Input type="number" placeholder="0" value={form.distanceKm || ''} onChange={(e) => setForm((p) => ({ ...p, distanceKm: parseInt(e.target.value) || 0 }))} />
            </FormField>
          </FormRow>
          <FormRow>
            <FormField label="Origin Hub" required>
              <Select value={form.originHubId} onChange={(e) => setForm((p) => ({ ...p, originHubId: e.target.value, departureSlotId: undefined }))}>
                <option value="">Select origin…</option>
                {hubs.map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
              </Select>
            </FormField>
            <FormField label="Destination Hub" required>
              <Select value={form.destinationHubId} onChange={(e) => setForm((p) => ({ ...p, destinationHubId: e.target.value, arrivalSlotId: undefined }))}>
                <option value="">Select destination…</option>
                {hubs.filter((h) => h.id !== form.originHubId).map((h) => <option key={h.id} value={h.id}>{h.iata} – {h.name}</option>)}
              </Select>
            </FormField>
          </FormRow>
          <FormField label="Status">
            <Select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as RouteStatus }))}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </FormField>
          <FormField label="Days of Operation">
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {DAYS.map((d, i) => (
                <button key={d} type="button" onClick={() => toggleDay(i)} style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: form.daysOfOperation.includes(i) ? '#0284c7' : '#0f172a',
                  color: form.daysOfOperation.includes(i) ? '#fff' : '#64748b',
                  border: `1px solid ${form.daysOfOperation.includes(i) ? '#0284c7' : '#334155'}`,
                }}>{d}</button>
              ))}
            </div>
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={saveRoute} disabled={!form.flightNumber || !form.originHubId || !form.destinationHubId}>Save Route</Btn>
          </div>
        </Modal>
      )}

      {modal === 'assign' && editing && (
        <Modal title={`Assign – ${editing.flightNumber}`} onClose={() => setModal(null)} width={480}>
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#0f172a', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#38bdf8' }}>{assignOriginHub?.iata}</strong>
            {' → '}
            <strong style={{ color: '#38bdf8' }}>{assignDestHub?.iata}</strong>
          </div>
          <FormField label="Aircraft">
            <Select value={assignForm.aircraftId} onChange={(e) => setAssignForm((p) => ({ ...p, aircraftId: e.target.value }))}>
              <option value="">No aircraft</option>
              {availableAc.map((a) => {
                const t = aircraftTypes.find((x) => x.id === a.typeId);
                return <option key={a.id} value={a.id}>{a.registration}{a.name ? ` – ${a.name}` : ''} ({t?.model ?? '?'})</option>;
              })}
            </Select>
          </FormField>
          <FormRow>
            <FormField label={`Departure Slot (${assignOriginHub?.iata ?? '?'})`}>
              <Select value={assignForm.departureSlotId} onChange={(e) => setAssignForm((p) => ({ ...p, departureSlotId: e.target.value }))}>
                <option value="">No slot</option>
                {depSlots.map((s) => <option key={s.id} value={s.id}>{s.time} – {s.terminalName}</option>)}
              </Select>
            </FormField>
            <FormField label={`Arrival Slot (${assignDestHub?.iata ?? '?'})`}>
              <Select value={assignForm.arrivalSlotId} onChange={(e) => setAssignForm((p) => ({ ...p, arrivalSlotId: e.target.value }))}>
                <option value="">No slot</option>
                {arrSlots.map((s) => <option key={s.id} value={s.id}>{s.time} – {s.terminalName}</option>)}
              </Select>
            </FormField>
          </FormRow>
          {depSlots.length === 0 && assignOriginHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No departure slots available at {assignOriginHub.iata}. Add slots in the Hubs page.
            </p>
          )}
          {arrSlots.length === 0 && assignDestHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No arrival slots available at {assignDestHub.iata}. Add slots in the Hubs page.
            </p>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setModal(null)}>Cancel</Btn>
            <Btn onClick={doAssign}>Save Assignment</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
