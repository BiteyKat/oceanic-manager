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
  terminals: Terminal[];
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
  routeId?: string;
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
  departureGateId?: string;
  arrivalGateId?: string;
  distanceKm: number;
  status: RouteStatus;
  daysOfOperation: number[]; // 0=Sun, 1=Mon ... 6=Sat
}
