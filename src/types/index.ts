export type AircraftCategory = 'narrowbody' | 'widebody' | 'regional' | 'turboprop';
export type RouteStatus = 'active' | 'suspended' | 'planned';

export interface Hub {
  id: string;
  name: string;
  iata: string;
  icao: string;
  city: string;
  country: string;
  timezone: string;
  lat?: number;
  lon?: number;
  terminals: Terminal[];
  isRouteAirport?: boolean; // true = auto-created from route selection, not a full hub
}

export interface Terminal {
  id: string;
  hubId: string;
  name: string;
  gates: Gate[];
}

export interface Gate {
  id: string;
  terminalId: string;
  hubId: string;
  name: string; // e.g. "A1", "Gate 12"
  routeId?: string; // points to a Flight id
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
  routeId?: string; // points to a Flight id
  status: 'available' | 'assigned' | 'maintenance';
}

export interface Flight {
  id: string;
  routeId: string;
  flightNumber: string;
  aircraftId?: string;
  departureGateId?: string;
  arrivalGateId?: string;
  status: RouteStatus;
  daysOfOperation: number[]; // 0=Sun … 6=Sat
}

export interface Route {
  id: string;
  originHubId: string;
  destinationHubId: string;
  distanceKm: number;
  flights: Flight[];
}
