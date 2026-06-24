import { useState } from 'react';
import { useStore } from '../store';
import type { Route, Flight, RouteStatus } from '../types';
import Modal from '../components/Modal';
import { FormField, FormRow, Input, Select, Btn } from '../components/FormField';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.asin(Math.sqrt(a)));
}

type RouteForm = Omit<Route, 'id' | 'flights'>;
type FlightForm = Omit<Flight, 'id' | 'routeId'>;

const emptyRoute = (): RouteForm => ({ originHubId: '', destinationHubId: '', distanceKm: 0 });
const emptyFlight = (): FlightForm => ({ flightNumber: '', status: 'planned', daysOfOperation: [1, 2, 3, 4, 5] });

const STATUS_COLORS: Record<RouteStatus, { bg: string; color: string }> = {
  active: { bg: '#14532d', color: '#4ade80' },
  planned: { bg: '#1e3a5f', color: '#60a5fa' },
  suspended: { bg: '#3b1515', color: '#f87171' },
};

export default function Routes() {
  const {
    routes, hubs, aircraft, aircraftTypes,
    addRoute, updateRoute, deleteRoute,
    addFlight, updateFlight, deleteFlight,
    assignAircraftToFlight, assignGatesToFlight,
  } = useStore();

  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [routeModal, setRouteModal] = useState<null | 'add' | 'edit'>(null);
  const [flightModal, setFlightModal] = useState<{ routeId: string; flight?: Flight } | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [routeForm, setRouteForm] = useState<RouteForm>(emptyRoute());
  const [flightForm, setFlightForm] = useState<FlightForm>(emptyFlight());
  const [originCode, setOriginCode] = useState('');
  const [destCode, setDestCode] = useState('');

  const findHub = (code: string) => {
    const u = code.trim().toUpperCase();
    return hubs.find((h) => h.icao.toUpperCase() === u || h.iata.toUpperCase() === u);
  };

  const handleOriginCode = (val: string) => {
    setOriginCode(val);
    setRouteForm((p) => ({ ...p, originHubId: findHub(val)?.id ?? '' }));
  };
  const handleDestCode = (val: string) => {
    setDestCode(val);
    setRouteForm((p) => ({ ...p, destinationHubId: findHub(val)?.id ?? '' }));
  };

  const openAddRoute = () => {
    setRouteForm(emptyRoute()); setOriginCode(''); setDestCode('');
    setEditingRoute(null); setRouteModal('add');
  };
  const openEditRoute = (r: Route) => {
    setEditingRoute(r);
    const orig = hubs.find((h) => h.id === r.originHubId);
    const dst = hubs.find((h) => h.id === r.destinationHubId);
    setOriginCode(orig?.icao ?? orig?.iata ?? '');
    setDestCode(dst?.icao ?? dst?.iata ?? '');
    setRouteForm({ originHubId: r.originHubId, destinationHubId: r.destinationHubId, distanceKm: r.distanceKm });
    setRouteModal('edit');
  };

  const openAddFlight = (routeId: string) => { setFlightModal({ routeId }); setFlightForm(emptyFlight()); };
  const openEditFlight = (routeId: string, flight: Flight) => {
    setFlightModal({ routeId, flight });
    setFlightForm({
      flightNumber: flight.flightNumber,
      status: flight.status,
      daysOfOperation: [...flight.daysOfOperation],
      aircraftId: flight.aircraftId,
      departureGateId: flight.departureGateId,
      arrivalGateId: flight.arrivalGateId,
    });
  };

  const saveRoute = () => {
    if (!routeForm.originHubId || !routeForm.destinationHubId) return;
    if (routeModal === 'add') addRoute(routeForm);
    else if (editingRoute) updateRoute(editingRoute.id, routeForm);
    setRouteModal(null);
  };

  const saveFlight = () => {
    if (!flightModal || !flightForm.flightNumber) return;
    const { routeId, flight } = flightModal;
    if (flight) {
      assignAircraftToFlight(routeId, flight.id, flightForm.aircraftId);
      assignGatesToFlight(routeId, flight.id, flightForm.departureGateId, flightForm.arrivalGateId);
      updateFlight(routeId, flight.id, {
        flightNumber: flightForm.flightNumber,
        status: flightForm.status,
        daysOfOperation: flightForm.daysOfOperation,
      });
    } else {
      addFlight(routeId, flightForm);
    }
    setFlightModal(null);
  };

  const toggleDay = (d: number) => {
    setFlightForm((p) => ({
      ...p,
      daysOfOperation: p.daysOfOperation.includes(d)
        ? p.daysOfOperation.filter((x) => x !== d)
        : [...p.daysOfOperation, d].sort(),
    }));
  };

  const flightModalRoute = flightModal ? routes.find((r) => r.id === flightModal.routeId) : null;
  const flightOriginHub = flightModalRoute ? hubs.find((h) => h.id === flightModalRoute.originHubId) : null;
  const flightDestHub = flightModalRoute ? hubs.find((h) => h.id === flightModalRoute.destinationHubId) : null;

  const availableAc = aircraft.filter((a) =>
    a.status === 'available' || (flightModal?.flight && a.id === flightModal.flight.aircraftId)
  );

  const depGates = flightOriginHub?.terminals.flatMap((t) =>
    t.gates
      .filter((g) => !g.routeId || g.routeId === flightModal?.flight?.id)
      .map((g) => ({ ...g, terminalName: t.name }))
  ) ?? [];

  const arrGates = flightDestHub?.terminals.flatMap((t) =>
    t.gates
      .filter((g) => !g.routeId || g.routeId === flightModal?.flight?.id)
      .map((g) => ({ ...g, terminalName: t.name }))
  ) ?? [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Routes</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Manage routes and scheduled flights</p>
        </div>
        <Btn onClick={openAddRoute} disabled={hubs.length < 2}>
          {hubs.length < 2 ? 'Need 2+ hubs' : '+ Add Route'}
        </Btn>
      </div>

      {routes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>↗</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>
            No routes yet. {hubs.length < 2 ? 'Add at least two hubs first.' : 'Add your first route.'}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {routes.map((route) => {
          const origin = hubs.find((h) => h.id === route.originHubId);
          const dest = hubs.find((h) => h.id === route.destinationHubId);
          const isExpanded = expandedRoute === route.id;
          const activeCount = route.flights.filter((f) => f.status === 'active').length;

          return (
            <div key={route.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                    {origin?.iata ?? '?'}
                  </div>
                  <span style={{ color: '#475569', fontSize: 16 }}>→</span>
                  <div style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 6, padding: '4px 10px', fontSize: 13, fontWeight: 700, letterSpacing: 1 }}>
                    {dest?.iata ?? '?'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>
                    {origin?.name ?? '?'} → {dest?.name ?? '?'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {route.distanceKm.toLocaleString()} km
                    {' · '}
                    {route.flights.length} flight{route.flights.length !== 1 ? 's' : ''}
                    {activeCount > 0 && ` · ${activeCount} active`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => openEditRoute(route)}>Edit</Btn>
                  <Btn variant="ghost" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setExpandedRoute(isExpanded ? null : route.id)}>
                    {isExpanded ? 'Collapse' : 'Flights ▾'}
                  </Btn>
                  <Btn variant="danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => deleteRoute(route.id)}>Delete</Btn>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: '1px solid #334155', padding: '16px 20px', background: '#162032' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontWeight: 600, fontSize: 14, color: '#94a3b8' }}>Flights</span>
                    <Btn style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => openAddFlight(route.id)}>+ Flight</Btn>
                  </div>

                  {route.flights.length === 0 && (
                    <p style={{ color: '#475569', fontSize: 13 }}>No flights yet. Add one above.</p>
                  )}

                  {route.flights.map((flight) => {
                    const ac = aircraft.find((a) => a.id === flight.aircraftId);
                    const acType = ac ? aircraftTypes.find((t) => t.id === ac.typeId) : null;
                    const depGateInfo = origin?.terminals.flatMap((t) =>
                      t.gates.filter((g) => g.id === flight.departureGateId).map((g) => ({ ...g, terminalName: t.name }))
                    )[0];
                    const arrGateInfo = dest?.terminals.flatMap((t) =>
                      t.gates.filter((g) => g.id === flight.arrivalGateId).map((g) => ({ ...g, terminalName: t.name }))
                    )[0];
                    const sc = STATUS_COLORS[flight.status];

                    return (
                      <div key={flight.id} style={{ marginBottom: 8, background: '#1e293b', borderRadius: 8, border: '1px solid #334155', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0' }}>{flight.flightNumber}</span>
                              <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: sc.bg, color: sc.color }}>
                                {flight.status}
                              </span>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, marginBottom: 8 }}>
                              <span style={{ color: '#64748b' }}>
                                Aircraft: <span style={{ color: ac ? '#94a3b8' : '#475569' }}>
                                  {ac ? `${ac.registration} (${acType?.model ?? '?'})` : 'Unassigned'}
                                </span>
                              </span>
                              <span style={{ color: '#334155' }}>·</span>
                              <span style={{ color: '#64748b' }}>
                                Dep: <span style={{ color: depGateInfo ? '#38bdf8' : '#475569' }}>
                                  {depGateInfo ? `${depGateInfo.name} – ${depGateInfo.terminalName}` : 'No gate'}
                                </span>
                              </span>
                              <span style={{ color: '#334155' }}>·</span>
                              <span style={{ color: '#64748b' }}>
                                Arr: <span style={{ color: arrGateInfo ? '#38bdf8' : '#475569' }}>
                                  {arrGateInfo ? `${arrGateInfo.name} – ${arrGateInfo.terminalName}` : 'No gate'}
                                </span>
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {DAYS.map((d, i) => (
                                <span key={d} style={{
                                  fontSize: 10, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                                  background: flight.daysOfOperation.includes(i) ? '#0c4a6e' : '#0f172a',
                                  color: flight.daysOfOperation.includes(i) ? '#38bdf8' : '#475569',
                                  border: `1px solid ${flight.daysOfOperation.includes(i) ? '#0369a1' : '#334155'}`,
                                }}>{d}</span>
                              ))}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <Btn variant="ghost" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => openEditFlight(route.id, flight)}>Edit</Btn>
                            <Btn variant="danger" style={{ padding: '3px 10px', fontSize: 11 }} onClick={() => deleteFlight(route.id, flight.id)}>×</Btn>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Route modal */}
      {(routeModal === 'add' || routeModal === 'edit') && (
        <Modal title={routeModal === 'add' ? 'Add Route' : 'Edit Route'} onClose={() => setRouteModal(null)} width={480}>
          <FormRow>
            <FormField label="Origin (ICAO / IATA)" required>
              <Input
                placeholder="e.g. EGLL or LHR"
                value={originCode}
                onChange={(e) => handleOriginCode(e.target.value)}
                autoFocus
              />
              {originCode && (
                <div style={{ fontSize: 12, marginTop: 4, color: routeForm.originHubId ? '#4ade80' : '#f87171' }}>
                  {routeForm.originHubId
                    ? `✓ ${hubs.find((h) => h.id === routeForm.originHubId)?.name}`
                    : 'No matching hub'}
                </div>
              )}
            </FormField>
            <FormField label="Destination (ICAO / IATA)" required>
              <Input
                placeholder="e.g. KJFK or JFK"
                value={destCode}
                onChange={(e) => handleDestCode(e.target.value)}
              />
              {destCode && (
                <div style={{ fontSize: 12, marginTop: 4, color: routeForm.destinationHubId ? '#4ade80' : '#f87171' }}>
                  {routeForm.destinationHubId
                    ? `✓ ${hubs.find((h) => h.id === routeForm.destinationHubId)?.name}`
                    : 'No matching hub'}
                </div>
              )}
            </FormField>
          </FormRow>
          <FormField label="Distance (km)" required>
            <Input
              type="number" placeholder="0"
              value={routeForm.distanceKm || ''}
              onChange={(e) => setRouteForm((p) => ({ ...p, distanceKm: parseInt(e.target.value) || 0 }))}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setRouteModal(null)}>Cancel</Btn>
            <Btn onClick={saveRoute} disabled={!routeForm.originHubId || !routeForm.destinationHubId}>Save Route</Btn>
          </div>
        </Modal>
      )}

      {/* Flight modal */}
      {flightModal && (
        <Modal
          title={flightModal.flight ? `Edit – ${flightModal.flight.flightNumber}` : 'Add Flight'}
          onClose={() => setFlightModal(null)}
          width={540}
        >
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#0f172a', borderRadius: 8, fontSize: 13, color: '#94a3b8' }}>
            <strong style={{ color: '#38bdf8' }}>{flightOriginHub?.iata}</strong>
            {' → '}
            <strong style={{ color: '#38bdf8' }}>{flightDestHub?.iata}</strong>
            {flightModalRoute && (
              <span style={{ marginLeft: 8, color: '#475569' }}>{flightModalRoute.distanceKm.toLocaleString()} km</span>
            )}
          </div>

          <FormRow>
            <FormField label="Flight Number" required>
              <Input
                placeholder="e.g. OC101"
                value={flightForm.flightNumber}
                onChange={(e) => setFlightForm((p) => ({ ...p, flightNumber: e.target.value.toUpperCase() }))}
              />
            </FormField>
            <FormField label="Status">
              <Select value={flightForm.status} onChange={(e) => setFlightForm((p) => ({ ...p, status: e.target.value as RouteStatus }))}>
                <option value="planned">Planned</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </Select>
            </FormField>
          </FormRow>

          <FormField label="Days of Operation">
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {DAYS.map((d, i) => (
                <button key={d} type="button" onClick={() => toggleDay(i)} style={{
                  padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: flightForm.daysOfOperation.includes(i) ? '#0284c7' : '#0f172a',
                  color: flightForm.daysOfOperation.includes(i) ? '#fff' : '#64748b',
                  border: `1px solid ${flightForm.daysOfOperation.includes(i) ? '#0284c7' : '#334155'}`,
                }}>{d}</button>
              ))}
            </div>
          </FormField>

          <FormField label="Aircraft">
            <Select
              value={flightForm.aircraftId ?? ''}
              onChange={(e) => setFlightForm((p) => ({ ...p, aircraftId: e.target.value || undefined }))}
            >
              <option value="">No aircraft</option>
              {availableAc.map((a) => {
                const t = aircraftTypes.find((x) => x.id === a.typeId);
                return (
                  <option key={a.id} value={a.id}>
                    {a.registration}{a.name ? ` – ${a.name}` : ''} ({t?.model ?? '?'})
                  </option>
                );
              })}
            </Select>
          </FormField>

          <FormRow>
            <FormField label={`Departure Gate (${flightOriginHub?.iata ?? '?'})`}>
              <Select
                value={flightForm.departureGateId ?? ''}
                onChange={(e) => setFlightForm((p) => ({ ...p, departureGateId: e.target.value || undefined }))}
              >
                <option value="">No gate</option>
                {depGates.map((g) => <option key={g.id} value={g.id}>{g.name} – {g.terminalName}</option>)}
              </Select>
            </FormField>
            <FormField label={`Arrival Gate (${flightDestHub?.iata ?? '?'})`}>
              <Select
                value={flightForm.arrivalGateId ?? ''}
                onChange={(e) => setFlightForm((p) => ({ ...p, arrivalGateId: e.target.value || undefined }))}
              >
                <option value="">No gate</option>
                {arrGates.map((g) => <option key={g.id} value={g.id}>{g.name} – {g.terminalName}</option>)}
              </Select>
            </FormField>
          </FormRow>

          {depGates.length === 0 && flightOriginHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No gates available at {flightOriginHub.iata}. Add gates in the Hubs page.
            </p>
          )}
          {arrGates.length === 0 && flightDestHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No gates available at {flightDestHub.iata}. Add gates in the Hubs page.
            </p>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setFlightModal(null)}>Cancel</Btn>
            <Btn onClick={saveFlight} disabled={!flightForm.flightNumber}>Save Flight</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
