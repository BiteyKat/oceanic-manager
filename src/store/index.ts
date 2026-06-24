import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Hub, Aircraft, AircraftType, Route } from '../types';

const DEFAULT_AIRCRAFT_TYPES: AircraftType[] = [
  // Boeing narrowbody
  { id: 'b737-700', manufacturer: 'Boeing', model: '737-700', category: 'narrowbody', paxCapacity: 128, rangeKm: 6370, cruiseSpeedKmh: 842 },
  { id: 'b737-800', manufacturer: 'Boeing', model: '737-800', category: 'narrowbody', paxCapacity: 162, rangeKm: 5765, cruiseSpeedKmh: 842 },
  { id: 'b737-900er', manufacturer: 'Boeing', model: '737-900ER', category: 'narrowbody', paxCapacity: 180, rangeKm: 5460, cruiseSpeedKmh: 842 },
  { id: 'b737-max8', manufacturer: 'Boeing', model: '737 MAX 8', category: 'narrowbody', paxCapacity: 178, rangeKm: 6570, cruiseSpeedKmh: 842 },
  { id: 'b737-max9', manufacturer: 'Boeing', model: '737 MAX 9', category: 'narrowbody', paxCapacity: 193, rangeKm: 6570, cruiseSpeedKmh: 842 },
  { id: 'b737-max10', manufacturer: 'Boeing', model: '737 MAX 10', category: 'narrowbody', paxCapacity: 204, rangeKm: 6110, cruiseSpeedKmh: 842 },
  { id: 'b757-200', manufacturer: 'Boeing', model: '757-200', category: 'narrowbody', paxCapacity: 200, rangeKm: 7250, cruiseSpeedKmh: 850 },
  // Boeing widebody
  { id: 'b767-300er', manufacturer: 'Boeing', model: '767-300ER', category: 'widebody', paxCapacity: 218, rangeKm: 11093, cruiseSpeedKmh: 851 },
  { id: 'b777-200er', manufacturer: 'Boeing', model: '777-200ER', category: 'widebody', paxCapacity: 314, rangeKm: 13080, cruiseSpeedKmh: 905 },
  { id: 'b777-300er', manufacturer: 'Boeing', model: '777-300ER', category: 'widebody', paxCapacity: 396, rangeKm: 13650, cruiseSpeedKmh: 905 },
  { id: 'b777x-9', manufacturer: 'Boeing', model: '777X-9', category: 'widebody', paxCapacity: 426, rangeKm: 13500, cruiseSpeedKmh: 905 },
  { id: 'b787-8', manufacturer: 'Boeing', model: '787-8', category: 'widebody', paxCapacity: 242, rangeKm: 13530, cruiseSpeedKmh: 903 },
  { id: 'b787-9', manufacturer: 'Boeing', model: '787-9', category: 'widebody', paxCapacity: 296, rangeKm: 14140, cruiseSpeedKmh: 903 },
  { id: 'b787-10', manufacturer: 'Boeing', model: '787-10', category: 'widebody', paxCapacity: 336, rangeKm: 11910, cruiseSpeedKmh: 903 },
  { id: 'b747-8', manufacturer: 'Boeing', model: '747-8', category: 'widebody', paxCapacity: 410, rangeKm: 14815, cruiseSpeedKmh: 903 },
  // Airbus narrowbody
  { id: 'a318', manufacturer: 'Airbus', model: 'A318', category: 'narrowbody', paxCapacity: 107, rangeKm: 7800, cruiseSpeedKmh: 833 },
  { id: 'a319', manufacturer: 'Airbus', model: 'A319', category: 'narrowbody', paxCapacity: 124, rangeKm: 6850, cruiseSpeedKmh: 833 },
  { id: 'a319neo', manufacturer: 'Airbus', model: 'A319neo', category: 'narrowbody', paxCapacity: 120, rangeKm: 7750, cruiseSpeedKmh: 833 },
  { id: 'a320ceo', manufacturer: 'Airbus', model: 'A320ceo', category: 'narrowbody', paxCapacity: 150, rangeKm: 6100, cruiseSpeedKmh: 833 },
  { id: 'a320neo', manufacturer: 'Airbus', model: 'A320neo', category: 'narrowbody', paxCapacity: 165, rangeKm: 6300, cruiseSpeedKmh: 833 },
  { id: 'a321ceo', manufacturer: 'Airbus', model: 'A321ceo', category: 'narrowbody', paxCapacity: 185, rangeKm: 5950, cruiseSpeedKmh: 833 },
  { id: 'a321neo', manufacturer: 'Airbus', model: 'A321neo', category: 'narrowbody', paxCapacity: 180, rangeKm: 7400, cruiseSpeedKmh: 833 },
  { id: 'a321xlr', manufacturer: 'Airbus', model: 'A321XLR', category: 'narrowbody', paxCapacity: 180, rangeKm: 8700, cruiseSpeedKmh: 833 },
  { id: 'a220-100', manufacturer: 'Airbus', model: 'A220-100', category: 'narrowbody', paxCapacity: 108, rangeKm: 5920, cruiseSpeedKmh: 871 },
  { id: 'a220-300', manufacturer: 'Airbus', model: 'A220-300', category: 'narrowbody', paxCapacity: 130, rangeKm: 6300, cruiseSpeedKmh: 871 },
  // Airbus widebody
  { id: 'a330-200', manufacturer: 'Airbus', model: 'A330-200', category: 'widebody', paxCapacity: 246, rangeKm: 13450, cruiseSpeedKmh: 871 },
  { id: 'a330-300', manufacturer: 'Airbus', model: 'A330-300', category: 'widebody', paxCapacity: 277, rangeKm: 11750, cruiseSpeedKmh: 871 },
  { id: 'a330-900neo', manufacturer: 'Airbus', model: 'A330-900neo', category: 'widebody', paxCapacity: 287, rangeKm: 13334, cruiseSpeedKmh: 912 },
  { id: 'a340-600', manufacturer: 'Airbus', model: 'A340-600', category: 'widebody', paxCapacity: 320, rangeKm: 14600, cruiseSpeedKmh: 881 },
  { id: 'a350-900', manufacturer: 'Airbus', model: 'A350-900', category: 'widebody', paxCapacity: 325, rangeKm: 15000, cruiseSpeedKmh: 910 },
  { id: 'a350-1000', manufacturer: 'Airbus', model: 'A350-1000', category: 'widebody', paxCapacity: 369, rangeKm: 16100, cruiseSpeedKmh: 910 },
  { id: 'a380-800', manufacturer: 'Airbus', model: 'A380-800', category: 'widebody', paxCapacity: 555, rangeKm: 15200, cruiseSpeedKmh: 903 },
  // Embraer regional
  { id: 'e170', manufacturer: 'Embraer', model: 'E170', category: 'regional', paxCapacity: 70, rangeKm: 3735, cruiseSpeedKmh: 870 },
  { id: 'e175', manufacturer: 'Embraer', model: 'E175', category: 'regional', paxCapacity: 80, rangeKm: 3735, cruiseSpeedKmh: 870 },
  { id: 'e190', manufacturer: 'Embraer', model: 'E190', category: 'regional', paxCapacity: 97, rangeKm: 4537, cruiseSpeedKmh: 870 },
  { id: 'e195', manufacturer: 'Embraer', model: 'E195', category: 'regional', paxCapacity: 118, rangeKm: 4260, cruiseSpeedKmh: 870 },
  { id: 'e190-e2', manufacturer: 'Embraer', model: 'E190-E2', category: 'regional', paxCapacity: 106, rangeKm: 5278, cruiseSpeedKmh: 870 },
  { id: 'e195-e2', manufacturer: 'Embraer', model: 'E195-E2', category: 'regional', paxCapacity: 146, rangeKm: 4800, cruiseSpeedKmh: 833 },
  // Bombardier regional
  { id: 'crj200', manufacturer: 'Bombardier', model: 'CRJ-200', category: 'regional', paxCapacity: 50, rangeKm: 3148, cruiseSpeedKmh: 833 },
  { id: 'crj700', manufacturer: 'Bombardier', model: 'CRJ-700', category: 'regional', paxCapacity: 70, rangeKm: 3700, cruiseSpeedKmh: 870 },
  { id: 'crj900', manufacturer: 'Bombardier', model: 'CRJ-900', category: 'regional', paxCapacity: 76, rangeKm: 2956, cruiseSpeedKmh: 870 },
  { id: 'crj1000', manufacturer: 'Bombardier', model: 'CRJ-1000', category: 'regional', paxCapacity: 100, rangeKm: 3004, cruiseSpeedKmh: 870 },
  // Turboprop
  { id: 'atr42-600', manufacturer: 'ATR', model: 'ATR 42-600', category: 'turboprop', paxCapacity: 50, rangeKm: 1326, cruiseSpeedKmh: 510 },
  { id: 'atr72-600', manufacturer: 'ATR', model: 'ATR 72-600', category: 'turboprop', paxCapacity: 70, rangeKm: 1528, cruiseSpeedKmh: 510 },
  { id: 'dash8-300', manufacturer: 'De Havilland', model: 'Dash 8-300', category: 'turboprop', paxCapacity: 50, rangeKm: 1558, cruiseSpeedKmh: 532 },
  { id: 'dash8-400', manufacturer: 'De Havilland', model: 'Dash 8-400', category: 'turboprop', paxCapacity: 74, rangeKm: 2522, cruiseSpeedKmh: 667 },
  { id: 'c208-caravan', manufacturer: 'Cessna', model: '208 Caravan', category: 'turboprop', paxCapacity: 9, rangeKm: 1982, cruiseSpeedKmh: 344 },
];

interface State {
  hubs: Hub[];
  aircraft: Aircraft[];
  aircraftTypes: AircraftType[];
  routes: Route[];

  // Hub actions
  addHub: (hub: Omit<Hub, 'id' | 'terminals'>) => void;
  updateHub: (id: string, data: Partial<Omit<Hub, 'id' | 'terminals'>>) => void;
  deleteHub: (id: string) => void;

  // Terminal actions
  addTerminal: (hubId: string, name: string) => void;
  updateTerminal: (hubId: string, terminalId: string, name: string) => void;
  deleteTerminal: (hubId: string, terminalId: string) => void;

  // Gate actions
  addGate: (hubId: string, terminalId: string, name: string) => void;
  updateGate: (hubId: string, terminalId: string, gateId: string, name: string) => void;
  deleteGate: (hubId: string, terminalId: string, gateId: string) => void;

  // Aircraft actions
  addAircraft: (a: Omit<Aircraft, 'id'>) => void;
  updateAircraft: (id: string, data: Partial<Omit<Aircraft, 'id'>>) => void;
  deleteAircraft: (id: string) => void;
  assignAircraftToHub: (aircraftId: string, hubId: string) => void;

  // Route actions
  addRoute: (r: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, data: Partial<Omit<Route, 'id'>>) => void;
  deleteRoute: (id: string) => void;
  assignAircraftToRoute: (routeId: string, aircraftId: string | undefined) => void;
  assignGatesToRoute: (routeId: string, departureGateId: string | undefined, arrivalGateId: string | undefined) => void;
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      hubs: [],
      aircraft: [],
      aircraftTypes: DEFAULT_AIRCRAFT_TYPES,
      routes: [],

      addHub: (hub) =>
        set((s) => ({
          hubs: [...s.hubs, { ...hub, id: uuid(), terminals: [] }],
        })),

      updateHub: (id, data) =>
        set((s) => ({
          hubs: s.hubs.map((h) => (h.id === id ? { ...h, ...data } : h)),
        })),

      deleteHub: (id) =>
        set((s) => ({
          hubs: s.hubs.filter((h) => h.id !== id),
          routes: s.routes.filter((r) => r.originHubId !== id && r.destinationHubId !== id),
          aircraft: s.aircraft.map((a) => (a.hubId === id ? { ...a, hubId: undefined, status: 'available' as const } : a)),
        })),

      addTerminal: (hubId, name) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? { ...h, terminals: [...h.terminals, { id: uuid(), hubId, name, gates: [] }] }
              : h
          ),
        })),

      updateTerminal: (hubId, terminalId, name) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? { ...h, terminals: h.terminals.map((t) => (t.id === terminalId ? { ...t, name } : t)) }
              : h
          ),
        })),

      deleteTerminal: (hubId, terminalId) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? { ...h, terminals: h.terminals.filter((t) => t.id !== terminalId) }
              : h
          ),
        })),

      addGate: (hubId, terminalId, name) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, gates: [...t.gates, { id: uuid(), terminalId, hubId, name }] }
                      : t
                  ),
                }
              : h
          ),
        })),

      updateGate: (hubId, terminalId, gateId, name) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, gates: t.gates.map((g) => (g.id === gateId ? { ...g, name } : g)) }
                      : t
                  ),
                }
              : h
          ),
        })),

      deleteGate: (hubId, terminalId, gateId) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, gates: t.gates.filter((g) => g.id !== gateId) }
                      : t
                  ),
                }
              : h
          ),
          routes: s.routes.map((r) => {
            const updates: Partial<Route> = {};
            if (r.departureGateId === gateId) updates.departureGateId = undefined;
            if (r.arrivalGateId === gateId) updates.arrivalGateId = undefined;
            return Object.keys(updates).length ? { ...r, ...updates } : r;
          }),
        })),

      addAircraft: (a) =>
        set((s) => ({ aircraft: [...s.aircraft, { ...a, id: uuid() }] })),

      updateAircraft: (id, data) =>
        set((s) => ({
          aircraft: s.aircraft.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),

      deleteAircraft: (id) =>
        set((s) => ({
          aircraft: s.aircraft.filter((a) => a.id !== id),
          routes: s.routes.map((r) => (r.aircraftId === id ? { ...r, aircraftId: undefined } : r)),
        })),

      assignAircraftToHub: (aircraftId, hubId) =>
        set((s) => ({
          aircraft: s.aircraft.map((a) =>
            a.id === aircraftId ? { ...a, hubId, status: 'available' as const } : a
          ),
        })),

      addRoute: (r) =>
        set((s) => ({ routes: [...s.routes, { ...r, id: uuid() }] })),

      updateRoute: (id, data) =>
        set((s) => ({
          routes: s.routes.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),

      deleteRoute: (id) =>
        set((s) => {
          const route = s.routes.find((r) => r.id === id);
          return {
            routes: s.routes.filter((r) => r.id !== id),
            aircraft: route?.aircraftId
              ? s.aircraft.map((a) =>
                  a.id === route.aircraftId ? { ...a, routeId: undefined, status: 'available' as const } : a
                )
              : s.aircraft,
            hubs: route
              ? s.hubs.map((h) => ({
                  ...h,
                  terminals: h.terminals.map((t) => ({
                    ...t,
                    gates: t.gates.map((g) =>
                      g.routeId === id ? { ...g, routeId: undefined } : g
                    ),
                  })),
                }))
              : s.hubs,
          };
        }),

      assignAircraftToRoute: (routeId, aircraftId) =>
        set((s) => {
          const prevRoute = s.routes.find((r) => r.id === routeId);
          const prevAircraftId = prevRoute?.aircraftId;
          return {
            routes: s.routes.map((r) => (r.id === routeId ? { ...r, aircraftId } : r)),
            aircraft: s.aircraft.map((a) => {
              if (a.id === prevAircraftId) return { ...a, routeId: undefined, status: 'available' as const };
              if (a.id === aircraftId) return { ...a, routeId, status: 'assigned' as const };
              return a;
            }),
          };
        }),

      assignGatesToRoute: (routeId, departureGateId, arrivalGateId) =>
        set((s) => {
          const prevRoute = s.routes.find((r) => r.id === routeId);
          return {
            routes: s.routes.map((r) =>
              r.id === routeId ? { ...r, departureGateId, arrivalGateId } : r
            ),
            hubs: s.hubs.map((h) => ({
              ...h,
              terminals: h.terminals.map((t) => ({
                ...t,
                gates: t.gates.map((g) => {
                  if (g.id === prevRoute?.departureGateId || g.id === prevRoute?.arrivalGateId) {
                    return { ...g, routeId: undefined };
                  }
                  if (g.id === departureGateId || g.id === arrivalGateId) {
                    return { ...g, routeId };
                  }
                  return g;
                }),
              })),
            })),
          };
        }),
    }),
    {
      name: 'oceanic-manager',
      version: 1,
      migrate: (persisted: any, version: number) => {
        if (version < 1) {
          // Migrate slots → gates on terminals, and slot IDs → gate IDs on routes
          return {
            ...persisted,
            hubs: (persisted.hubs ?? []).map((h: any) => ({
              ...h,
              terminals: (h.terminals ?? []).map((t: any) => ({
                ...t,
                gates: t.gates ?? (t.slots ?? []).map((s: any) => ({
                  id: s.id,
                  terminalId: t.id,
                  hubId: h.id,
                  name: s.name ?? s.type ?? 'Gate',
                })),
              })),
            })),
            routes: (persisted.routes ?? []).map((r: any) => ({
              ...r,
              departureGateId: r.departureGateId ?? r.departureSlotId,
              arrivalGateId: r.arrivalGateId ?? r.arrivalSlotId,
            })),
          };
        }
        return persisted;
      },
    }
  )
);
