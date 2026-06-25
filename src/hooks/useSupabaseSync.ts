import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { loadUserData, saveUserData } from '../lib/sync';

export function useSupabaseSync(userId: string | undefined) {
  const loadState = useStore((s) => s.loadState);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false); // true after initial load, so saves don't fire during load

  useEffect(() => {
    readyRef.current = false;

    if (!userId) {
      loadState({ hubs: [], aircraft: [], routes: [] });
      return;
    }

    const init = async () => {
      const remote = await loadUserData(userId);
      if (remote) {
        loadState(remote);
      } else {
        // First login: push whatever is already in the store (migrates localStorage data)
        const s = useStore.getState();
        await saveUserData(userId, { hubs: s.hubs, aircraft: s.aircraft, routes: s.routes });
      }
      readyRef.current = true;
    };

    init();
  }, [userId]);

  // Debounced auto-save on any store change
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useStore.subscribe((state) => {
      if (!readyRef.current) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveUserData(userId, { hubs: state.hubs, aircraft: state.aircraft, routes: state.routes });
      }, 1500);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId]);
}
