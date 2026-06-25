import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { loadUserData, saveUserData } from '../lib/sync';

export function useSupabaseSync(userId: string | undefined) {
  const loadState = useStore((s) => s.loadState);
  const setSyncStatus = useStore((s) => s.setSyncStatus);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const readyRef = useRef(false);

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
        // First login: push whatever is already in the store
        const s = useStore.getState();
        setSyncStatus('saving');
        const err = await saveUserData(userId, { hubs: s.hubs, aircraft: s.aircraft, routes: s.routes });
        if (err) setSyncStatus('error', err);
        else setSyncStatus('saved');
      }
      readyRef.current = true;
    };

    init();
  }, [userId]);

  // Debounced auto-save on any store change
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = useStore.subscribe((state, prevState) => {
      if (!readyRef.current) return;
      // Guard: only save when actual data changes, not when sync metadata changes.
      // Without this, setSyncStatus triggers subscribe again → infinite loop.
      if (
        state.hubs === prevState.hubs &&
        state.aircraft === prevState.aircraft &&
        state.routes === prevState.routes
      ) return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSyncStatus('saving');
      saveTimerRef.current = setTimeout(async () => {
        const err = await saveUserData(userId, { hubs: state.hubs, aircraft: state.aircraft, routes: state.routes });
        if (err) setSyncStatus('error', err);
        else setSyncStatus('saved');
      }, 1500);
    });

    return () => {
      unsubscribe();
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [userId]);
}
