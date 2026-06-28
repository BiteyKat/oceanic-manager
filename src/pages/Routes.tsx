import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import type { Route, Flight, RouteStatus } from '../types';
import type { AirportRecord } from '../data/airports';
import { findAirport, searchAirports } from '../data/airports';
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
const emptyFlight = (): FlightForm => ({ flightNumber: '', status: 'planned', daysOfOperation: [1, 2, 3, 4, 5], departureTime: '', arrivalTime: '', direction: 'outbound' });

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function flightsConflict(
  a: { daysOfOperation: number[]; departureTime?: string; arrivalTime?: string },
  b: { daysOfOperation: number[]; departureTime?: string; arrivalTime?: string }
): boolean {
  if (!a.daysOfOperation.some((d) => b.daysOfOperation.includes(d))) return false;
  if (!a.departureTime || !a.arrivalTime || !b.departureTime || !b.arrivalTime) return false;
  const aS = timeToMins(a.departureTime), aE = timeToMins(a.arrivalTime);
  const bS = timeToMins(b.departureTime), bE = timeToMins(b.arrivalTime);
  const aEadj = aE <= aS ? aE + 1440 : aE;
  const bEadj = bE <= bS ? bE + 1440 : bE;
  return aS < bEadj && bS < aEadj;
}

const STATUS_COLORS: Record<RouteStatus, { bg: string; color: string }> = {
  active: { bg: '#14532d', color: '#4ade80' },
  planned: { bg: '#1e3a5f', color: '#60a5fa' },
  suspended: { bg: '#3b1515', color: '#f87171' },
};

function AirportInput({
  label, value, airport, onSelect, onClear, hubBadge,
}: {
  label: string;
  value: string;
  airport: AirportRecord | null;
  onSelect: (a: AirportRecord) => void;
  onClear: () => void;
  hubBadge?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<AirportRecord[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync if parent clears
  useEffect(() => {
    if (!value) { setQuery(''); setSuggestions([]); setOpen(false); }
    else if (value !== query) setQuery(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    if (!v) { onClear(); setSuggestions([]); setOpen(false); return; }
    const s = searchAirports(v, 8);
    setSuggestions(s);
    setOpen(s.length > 0);
    // If exact match, resolve immediately
    const exact = findAirport(v);
    if (exact) onSelect(exact);
    else onClear();
  };

  const pick = (a: AirportRecord) => {
    setQuery(a.iata);
    setOpen(false);
    setSuggestions([]);
    onSelect(a);
  };

  return (
    <FormField label={label} required>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <Input
          placeholder="IATA or ICAO code, city…"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          autoComplete="off"
        />
        {open && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
            background: '#1e293b', border: '1px solid #334155', borderRadius: 6, marginTop: 2,
            maxHeight: 240, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            {suggestions.map((a) => (
              <div
                key={a.iata}
                onMouseDown={(e) => { e.preventDefault(); pick(a); }}
                style={{
                  padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  borderBottom: '1px solid #0f172a',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0f172a')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 700, fontSize: 13, color: '#38bdf8', minWidth: 34 }}>{a.iata}</span>
                <span style={{ fontSize: 12, color: '#64748b', minWidth: 40 }}>{a.icao}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{a.city}, {a.country} · <span style={{ color: '#475569' }}>{a.timezone}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {airport && (
        <div style={{ fontSize: 12, marginTop: 4, color: '#4ade80', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>✓ {airport.name}</span>
          {hubBadge && <span style={{ background: '#0c4a6e', color: '#38bdf8', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>Hub</span>}
        </div>
      )}
      {query && !airport && (
        <div style={{ fontSize: 12, marginTop: 4, color: '#f87171' }}>No matching airport</div>
      )}
    </FormField>
  );
}

export default function Routes() {
  const {
    routes, hubs, aircraft, aircraftTypes,
    addRoute, updateRoute, deleteRoute,
    addFlight, updateFlight, deleteFlight,
    assignAircraftToFlight, assignGatesToFlight,
    addHub,
  } = useStore();

  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [routeModal, setRouteModal] = useState<null | 'add' | 'edit'>(null);
  const [flightModal, setFlightModal] = useState<{ routeId: string; flight?: Flight } | null>(null);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  const [routeForm, setRouteForm] = useState<RouteForm>(emptyRoute());
  const [flightForm, setFlightForm] = useState<FlightForm>(emptyFlight());
  const [originAirport, setOriginAirport] = useState<AirportRecord | null>(null);
  const [destAirport, setDestAirport] = useState<AirportRecord | null>(null);
  const [originCode, setOriginCode] = useState('');
  const [destCode, setDestCode] = useState('');
  const [distAutoCalc, setDistAutoCalc] = useState(false);

  // Find or resolve hub for an airport record
  const resolveHub = (a: AirportRecord) =>
    hubs.find((h) => h.iata.toUpperCase() === a.iata.toUpperCase() || h.icao.toUpperCase() === a.icao.toUpperCase());

  const calcDist = (a: AirportRecord | null, b: AirportRecord | null) => {
    if (a && b) return haversineKm(a.lat, a.lon, b.lat, b.lon);
    return undefined;
  };

  const handleSelectOrigin = (a: AirportRecord) => {
    setOriginAirport(a);
    setOriginCode(a.iata);
    const hub = resolveHub(a);
    const dist = calcDist(a, destAirport);
    if (dist !== undefined) setDistAutoCalc(true);
    setRouteForm((p) => ({
      ...p,
      originHubId: hub?.id ?? '__pending__',
      ...(dist !== undefined ? { distanceKm: dist } : {}),
    }));
  };

  const handleSelectDest = (a: AirportRecord) => {
    setDestAirport(a);
    setDestCode(a.iata);
    const hub = resolveHub(a);
    const dist = calcDist(originAirport, a);
    if (dist !== undefined) setDistAutoCalc(true);
    setRouteForm((p) => ({
      ...p,
      destinationHubId: hub?.id ?? '__pending__',
      ...(dist !== undefined ? { distanceKm: dist } : {}),
    }));
  };

  const clearOrigin = () => {
    setOriginAirport(null); setOriginCode('');
    setRouteForm((p) => ({ ...p, originHubId: '' }));
    setDistAutoCalc(false);
  };
  const clearDest = () => {
    setDestAirport(null); setDestCode('');
    setRouteForm((p) => ({ ...p, destinationHubId: '' }));
    setDistAutoCalc(false);
  };

  // Ensure hub exists for an airport, creating one if needed; returns hub id
  const ensureHub = (a: AirportRecord): string => {
    const existing = resolveHub(a);
    if (existing) return existing.id;
    // Create minimal hub from airport data
    addHub({
      name: a.name,
      iata: a.iata,
      icao: a.icao,
      city: a.city,
      country: a.country,
      timezone: 'UTC',
      lat: a.lat,
      lon: a.lon,
      isRouteAirport: true,
    });
    // addHub is synchronous in Zustand — re-read
    return useStore.getState().hubs.find(
      (h) => h.iata.toUpperCase() === a.iata.toUpperCase()
    )!.id;
  };

  const openAddRoute = () => {
    setRouteForm(emptyRoute()); setOriginAirport(null); setDestAirport(null);
    setOriginCode(''); setDestCode(''); setDistAutoCalc(false);
    setEditingRoute(null); setRouteModal('add');
  };

  const openEditRoute = (r: Route) => {
    setEditingRoute(r);
    const origHub = hubs.find((h) => h.id === r.originHubId);
    const dstHub = hubs.find((h) => h.id === r.destinationHubId);
    const origAirport = origHub ? findAirport(origHub.iata) ?? findAirport(origHub.icao) ?? null : null;
    const dstAirport = dstHub ? findAirport(dstHub.iata) ?? findAirport(dstHub.icao) ?? null : null;
    const dist = calcDist(origAirport, dstAirport);
    setOriginAirport(origAirport);
    setDestAirport(dstAirport);
    setOriginCode(origHub?.iata ?? origHub?.icao ?? '');
    setDestCode(dstHub?.iata ?? dstHub?.icao ?? '');
    setDistAutoCalc(dist !== undefined);
    setRouteForm({
      originHubId: r.originHubId,
      destinationHubId: r.destinationHubId,
      distanceKm: dist ?? r.distanceKm,
    });
    setRouteModal('edit');
  };

  const saveRoute = () => {
    if (!originAirport || !destAirport) return;
    const originHubId = ensureHub(originAirport);
    const destinationHubId = ensureHub(destAirport);
    const form = { ...routeForm, originHubId, destinationHubId };
    if (routeModal === 'add') addRoute(form);
    else if (editingRoute) updateRoute(editingRoute.id, form);
    setRouteModal(null);
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
      departureTime: flight.departureTime ?? '',
      arrivalTime: flight.arrivalTime ?? '',
      direction: flight.direction ?? 'outbound',
    });
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
        departureTime: flightForm.departureTime || undefined,
        arrivalTime: flightForm.arrivalTime || undefined,
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

  const draftFlight = {
    daysOfOperation: flightForm.daysOfOperation,
    departureTime: flightForm.departureTime,
    arrivalTime: flightForm.arrivalTime,
  };
  const allFlights = routes.flatMap((r) => r.flights);
  const conflictingAcIds = new Set(
    aircraft
      .filter((a) => a.status !== 'maintenance')
      .filter((a) => {
        const acFlights = allFlights.filter(
          (f) => f.aircraftId === a.id && f.id !== flightModal?.flight?.id
        );
        return acFlights.some((f) => flightsConflict(draftFlight, f));
      })
      .map((a) => a.id)
  );
  const availableAc = aircraft.filter((a) => a.status !== 'maintenance');

  const depGates = flightOriginHub?.terminals.flatMap((t) =>
    t.gates.map((g) => ({ ...g, terminalName: t.name }))
  ) ?? [];

  const arrGates = flightDestHub?.terminals.flatMap((t) =>
    t.gates.map((g) => ({ ...g, terminalName: t.name }))
  ) ?? [];

  const conflictingGateIds = new Set(
    [...depGates, ...arrGates]
      .filter((g) => {
        if (!g.routeId || g.routeId === flightModal?.flight?.id) return false;
        const occupyingFlight = allFlights.find((f) => f.id === g.routeId);
        return occupyingFlight ? flightsConflict(draftFlight, occupyingFlight) : false;
      })
      .map((g) => g.id)
  );

  const newHubsNeeded = routeModal ? [
    originAirport && !resolveHub(originAirport) ? originAirport : null,
    destAirport && !resolveHub(destAirport) ? destAirport : null,
  ].filter(Boolean) as AirportRecord[] : [];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>Routes</h1>
          <p style={{ color: '#64748b', marginTop: 4 }}>Manage routes and scheduled flights</p>
        </div>
        <Btn onClick={openAddRoute}>+ Add Route</Btn>
      </div>

      {routes.length === 0 && (
        <div style={{ textAlign: 'center', padding: 64, color: '#475569', border: '1px dashed #334155', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>↗</div>
          <p style={{ fontSize: 16, color: '#64748b' }}>No routes yet. Add your first route.</p>
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
                              {(flight.departureTime || flight.arrivalTime) && (
                                <>
                                  <span style={{ color: '#334155' }}>·</span>
                                  <span style={{ color: '#64748b' }}>
                                    {flight.departureTime && <span style={{ color: '#94a3b8' }}>{flight.departureTime}</span>}
                                    {flight.departureTime && flight.arrivalTime && <span style={{ color: '#475569' }}> → </span>}
                                    {flight.arrivalTime && <span style={{ color: '#94a3b8' }}>{flight.arrivalTime}</span>}
                                  </span>
                                </>
                              )}
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
        <Modal title={routeModal === 'add' ? 'Add Route' : 'Edit Route'} onClose={() => setRouteModal(null)} width={520}>
          <FormRow>
            <AirportInput
              label="Origin"
              value={originCode}
              airport={originAirport}
              hubBadge={!!(originAirport && resolveHub(originAirport))}
              onSelect={handleSelectOrigin}
              onClear={clearOrigin}
            />
            <AirportInput
              label="Destination"
              value={destCode}
              airport={destAirport}
              hubBadge={!!(destAirport && resolveHub(destAirport))}
              onSelect={handleSelectDest}
              onClear={clearDest}
            />
          </FormRow>
          <FormField label="Distance (km)" required hint={distAutoCalc ? 'Auto-calculated from coordinates' : undefined}>
            <Input
              type="number" placeholder="0"
              value={routeForm.distanceKm || ''}
              onChange={(e) => { setDistAutoCalc(false); setRouteForm((p) => ({ ...p, distanceKm: parseInt(e.target.value) || 0 })); }}
            />
          </FormField>
          {newHubsNeeded.length > 0 && (
            <div style={{ background: '#0c2a1a', border: '1px solid #166534', borderRadius: 6, padding: '10px 14px', fontSize: 12, color: '#4ade80', marginBottom: 8 }}>
              <strong>New airports will be created:</strong>{' '}
              {newHubsNeeded.map((a) => `${a.iata} – ${a.name}`).join(', ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Btn variant="ghost" onClick={() => setRouteModal(null)}>Cancel</Btn>
            <Btn onClick={saveRoute} disabled={!originAirport || !destAirport || !routeForm.distanceKm}>Save Route</Btn>
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
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#0f172a', borderRadius: 8, fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 10 }}>
            <strong style={{ color: '#38bdf8' }}>{flightOriginHub?.iata}</strong>
            {' → '}
            <strong style={{ color: '#38bdf8' }}>{flightDestHub?.iata}</strong>
            {flightModalRoute && (
              <span style={{ color: '#475569' }}>{flightModalRoute.distanceKm.toLocaleString()} km</span>
            )}
            {(() => {
              const reverseRoute = flightModalRoute
                ? routes.find((r) => r.originHubId === flightModalRoute.destinationHubId && r.destinationHubId === flightModalRoute.originHubId)
                : null;
              return (
                <button
                  type="button"
                  title={reverseRoute ? `Switch to ${flightDestHub?.iata} → ${flightOriginHub?.iata}` : 'No reverse route exists'}
                  disabled={!reverseRoute}
                  onClick={() => {
                    if (!reverseRoute) return;
                    setFlightModal((p) => p ? { routeId: reverseRoute.id, flight: undefined } : null);
                    setFlightForm((p) => ({ ...p, departureGateId: undefined, arrivalGateId: undefined, aircraftId: undefined }));
                  }}
                  style={{
                    marginLeft: 'auto', padding: '3px 8px', background: reverseRoute ? '#1e293b' : 'transparent',
                    border: `1px solid ${reverseRoute ? '#334155' : '#1e293b'}`, borderRadius: 5,
                    color: reverseRoute ? '#94a3b8' : '#334155', cursor: reverseRoute ? 'pointer' : 'default',
                    fontSize: 14, lineHeight: 1,
                  }}
                  onMouseEnter={(e) => { if (reverseRoute) { e.currentTarget.style.background = '#334155'; e.currentTarget.style.color = '#e2e8f0'; } }}
                  onMouseLeave={(e) => { if (reverseRoute) { e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = '#94a3b8'; } }}
                >⇄</button>
              );
            })()}
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

          <FormRow>
            <FormField label={`Departure Time (${flightOriginHub?.timezone ?? 'local'})`}>
              <Input
                type="time"
                value={flightForm.departureTime ?? ''}
                onChange={(e) => setFlightForm((p) => ({ ...p, departureTime: e.target.value }))}
              />
            </FormField>
            <FormField label={`Arrival Time (${flightDestHub?.timezone ?? 'local'})`}>
              <Input
                type="time"
                value={flightForm.arrivalTime ?? ''}
                onChange={(e) => setFlightForm((p) => ({ ...p, arrivalTime: e.target.value }))}
              />
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
              onChange={(e) => {
                const aircraftId = e.target.value || undefined;
                // Auto-fill departure gate: find the arrival gate from the last time
                // this aircraft landed at the origin airport
                let departureGateId = flightForm.departureGateId;
                if (aircraftId && flightModalRoute) {
                  const inboundFlight = routes
                    .filter((r) => r.destinationHubId === flightModalRoute.originHubId)
                    .flatMap((r) => r.flights)
                    .filter((f) => f.aircraftId === aircraftId && f.id !== flightModal?.flight?.id && f.arrivalGateId)
                    .sort((a, b) => {
                      // prefer latest arrival time
                      if (!a.arrivalTime) return 1;
                      if (!b.arrivalTime) return -1;
                      return b.arrivalTime.localeCompare(a.arrivalTime);
                    })[0];
                  if (inboundFlight?.arrivalGateId) {
                    // Only use it if that gate is at the origin hub and not conflicting
                    const gateExists = depGates.some((g) => g.id === inboundFlight.arrivalGateId);
                    const gateConflicts = conflictingGateIds.has(inboundFlight.arrivalGateId);
                    if (gateExists && !gateConflicts) departureGateId = inboundFlight.arrivalGateId;
                  }
                }
                setFlightForm((p) => ({ ...p, aircraftId, departureGateId }));
              }}
            >
              <option value="">No aircraft</option>
              {availableAc.map((a) => {
                const t = aircraftTypes.find((x) => x.id === a.typeId);
                const conflict = conflictingAcIds.has(a.id);
                return (
                  <option key={a.id} value={a.id} disabled={conflict}>
                    {conflict ? '⚠ ' : ''}{a.registration}{a.name ? ` – ${a.name}` : ''} ({t?.model ?? '?'}){conflict ? ' – schedule conflict' : ''}
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
                {depGates.map((g) => {
                  const conflict = conflictingGateIds.has(g.id);
                  return <option key={g.id} value={g.id} disabled={conflict}>{conflict ? '⚠ ' : ''}{g.name} – {g.terminalName}{conflict ? ' – schedule conflict' : ''}</option>;
                })}
              </Select>
            </FormField>
            <FormField label={`Arrival Gate (${flightDestHub?.iata ?? '?'})`}>
              <Select
                value={flightForm.arrivalGateId ?? ''}
                onChange={(e) => setFlightForm((p) => ({ ...p, arrivalGateId: e.target.value || undefined }))}
              >
                <option value="">No gate</option>
                {arrGates.map((g) => {
                  const conflict = conflictingGateIds.has(g.id);
                  return <option key={g.id} value={g.id} disabled={conflict}>{conflict ? '⚠ ' : ''}{g.name} – {g.terminalName}{conflict ? ' – schedule conflict' : ''}</option>;
                })}
              </Select>
            </FormField>
          </FormRow>

          {depGates.length === 0 && flightOriginHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No gates available at {flightOriginHub.iata}. Add gates in the Airports or Hubs page.
            </p>
          )}
          {arrGates.length === 0 && flightDestHub && (
            <p style={{ fontSize: 12, color: '#f59e0b', marginTop: -8, marginBottom: 8 }}>
              No gates available at {flightDestHub.iata}. Add gates in the Airports or Hubs page.
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
