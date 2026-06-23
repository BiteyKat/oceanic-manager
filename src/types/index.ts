export type AircraftCategory = 'narrowbody' | 'widebody' | 'regional' | 'turboprop';
export type SlotType = 'departure' | 'arrival' | 'both';
export type RouteStatus = 'active' | 'suspended' | 'planned';

export interface Hub {
  id: string;
  name: string;
  iata: string;
  icao: string;
  city: string;
  country: string;
  timezone: string;
  terminals: Terminal[];
}

export interface Terminal {
  id: string;
  hubId: string;
  name: string;
  slots: Slot[];
}

export interface Slot {
  id: string;
  terminalId: string;
  hubId: string;
  time: string; // "HH:MM"
  type: SlotType;
  routeId?: string; // assigned route
}

export interface AircraftType {
  id: string;
  manufacturer: string;
  model: string;
  category: AircraftCategory;
  paxCapacity: number;
  rangeKm: number;
  cruiseSpeedKmh: number;
}

export interface Aircraft {
  id: string;
  registration: string;
  typeId: string;
  name?: string;
  hubId?: string;
  routeId?: string;
  status: 'available' | 'assigned' | 'maintenance';
}

export interface Route {
  id: string;
  flightNumber: string;
  originHubId: string;
  destinationHubId: string;
  aircraftId?: string;
  departureSlotId?: string;
  arrivalSlotId?: string;
  distanceKm: number;
  status: RouteStatus;
  daysOfOperation: number[]; // 0=Sun, 1=Mon ... 6=Sat
}
