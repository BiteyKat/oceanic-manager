import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { Hub, Slot, Aircraft, AircraftType, Route } from '../types';

const DEFAULT_AIRCRAFT_TYPES: AircraftType[] = [
  { id: 'b737-800', manufacturer: 'Boeing', model: '737-800', category: 'narrowbody', paxCapacity: 162, rangeKm: 5765, cruiseSpeedKmh: 842 },
  { id: 'b737-max9', manufacturer: 'Boeing', model: '737 MAX 9', category: 'narrowbody', paxCapacity: 178, rangeKm: 6570, cruiseSpeedKmh: 842 },
  { id: 'b787-9', manufacturer: 'Boeing', model: '787-9', category: 'widebody', paxCapacity: 296, rangeKm: 14140, cruiseSpeedKmh: 903 },
  { id: 'b777-300er', manufacturer: 'Boeing', model: '777-300ER', category: 'widebody', paxCapacity: 396, rangeKm: 13650, cruiseSpeedKmh: 905 },
  { id: 'a319', manufacturer: 'Airbus', model: 'A319', category: 'narrowbody', paxCapacity: 124, rangeKm: 6850, cruiseSpeedKmh: 833 },
  { id: 'a320neo', manufacturer: 'Airbus', model: 'A320neo', category: 'narrowbody', paxCapacity: 165, rangeKm: 6300, cruiseSpeedKmh: 833 },
  { id: 'a321xlr', manufacturer: 'Airbus', model: 'A321XLR', category: 'narrowbody', paxCapacity: 180, rangeKm: 8700, cruiseSpeedKmh: 833 },
  { id: 'a330-300', manufacturer: 'Airbus', model: 'A330-300', category: 'widebody', paxCapacity: 277, rangeKm: 11750, cruiseSpeedKmh: 871 },
  { id: 'a350-900', manufacturer: 'Airbus', model: 'A350-900', category: 'widebody', paxCapacity: 325, rangeKm: 15000, cruiseSpeedKmh: 910 },
  { id: 'e175', manufacturer: 'Embraer', model: 'E175', category: 'regional', paxCapacity: 80, rangeKm: 3735, cruiseSpeedKmh: 870 },
  { id: 'crj900', manufacturer: 'Bombardier', model: 'CRJ-900', category: 'regional', paxCapacity: 76, rangeKm: 2956, cruiseSpeedKmh: 870 },
  { id: 'dash8-400', manufacturer: 'De Havilland', model: 'Dash 8-400', category: 'turboprop', paxCapacity: 74, rangeKm: 2522, cruiseSpeedKmh: 667 },
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

  // Slot actions
  addSlot: (hubId: string, terminalId: string, slot: Omit<Slot, 'id' | 'terminalId' | 'hubId' | 'routeId'>) => void;
  updateSlot: (hubId: string, terminalId: string, slotId: string, data: Partial<Pick<Slot, 'time' | 'type'>>) => void;
  deleteSlot: (hubId: string, terminalId: string, slotId: string) => void;

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
  assignSlotsToRoute: (routeId: string, departureSlotId: string | undefined, arrivalSlotId: string | undefined) => void;
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
              ? { ...h, terminals: [...h.terminals, { id: uuid(), hubId, name, slots: [] }] }
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

      addSlot: (hubId, terminalId, slot) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, slots: [...t.slots, { ...slot, id: uuid(), terminalId, hubId }] }
                      : t
                  ),
                }
              : h
          ),
        })),

      updateSlot: (hubId, terminalId, slotId, data) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, slots: t.slots.map((sl) => (sl.id === slotId ? { ...sl, ...data } : sl)) }
                      : t
                  ),
                }
              : h
          ),
        })),

      deleteSlot: (hubId, terminalId, slotId) =>
        set((s) => ({
          hubs: s.hubs.map((h) =>
            h.id === hubId
              ? {
                  ...h,
                  terminals: h.terminals.map((t) =>
                    t.id === terminalId
                      ? { ...t, slots: t.slots.filter((sl) => sl.id !== slotId) }
                      : t
                  ),
                }
              : h
          ),
          routes: s.routes.map((r) => {
            const updates: Partial<Route> = {};
            if (r.departureSlotId === slotId) updates.departureSlotId = undefined;
            if (r.arrivalSlotId === slotId) updates.arrivalSlotId = undefined;
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
                    slots: t.slots.map((sl) =>
                      sl.routeId === id ? { ...sl, routeId: undefined } : sl
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

      assignSlotsToRoute: (routeId, departureSlotId, arrivalSlotId) =>
        set((s) => {
          const prevRoute = s.routes.find((r) => r.id === routeId);
          return {
            routes: s.routes.map((r) =>
              r.id === routeId ? { ...r, departureSlotId, arrivalSlotId } : r
            ),
            hubs: s.hubs.map((h) => ({
              ...h,
              terminals: h.terminals.map((t) => ({
                ...t,
                slots: t.slots.map((sl) => {
                  if (sl.id === prevRoute?.departureSlotId || sl.id === prevRoute?.arrivalSlotId) {
                    return { ...sl, routeId: undefined };
                  }
                  if (sl.id === departureSlotId || sl.id === arrivalSlotId) {
                    return { ...sl, routeId };
                  }
                  return sl;
                }),
              })),
            })),
          };
        }),
    }),
    { name: 'oceanic-manager' }
  )
);
