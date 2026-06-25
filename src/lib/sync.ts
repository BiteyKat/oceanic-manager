import { supabase } from './supabase';
import type { Hub, Aircraft, Route } from '../types';

export interface AppData {
  hubs: Hub[];
  aircraft: Aircraft[];
  routes: Route[];
}

export async function loadUserData(userId: string): Promise<AppData | null> {
  const { data, error } = await supabase
    .from('app_state')
    .select('hubs, aircraft, routes')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no row yet — first login
    console.error('Supabase load error:', error);
    return null;
  }

  return {
    hubs: (data.hubs as Hub[]) ?? [],
    aircraft: (data.aircraft as Aircraft[]) ?? [],
    routes: (data.routes as Route[]) ?? [],
  };
}

export async function saveUserData(userId: string, data: AppData): Promise<void> {
  const { error } = await supabase.from('app_state').upsert({
    user_id: userId,
    hubs: data.hubs,
    aircraft: data.aircraft,
    routes: data.routes,
    updated_at: new Date().toISOString(),
  });

  if (error) console.error('Supabase save error:', error);
}
