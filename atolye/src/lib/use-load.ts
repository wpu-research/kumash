import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

// Ekran odaklandığında veriyi çeker; istenirse belirli aralıkla yeniler (ör. işlenen çekim).
export function useLoad<T>(fn: () => Promise<T>, opts: { pollMs?: number | false } = {}) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  const run = useCallback(async (mode: 'initial' | 'refresh' | 'silent' = 'silent') => {
    if (mode === 'refresh') setRefreshing(true);
    try {
      setData(await fnRef.current());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void run('silent');
    }, [run]),
  );

  const poll = opts.pollMs;
  useEffect(() => {
    if (!poll) return;
    const t = setInterval(() => void run('silent'), poll);
    return () => clearInterval(t);
  }, [poll, run]);

  // refresh/reload kimliği sabit kalmalı: abonelik kuran efektler bunlara bağlanıyor.
  const refresh = useCallback(() => run('refresh'), [run]);
  const reload = useCallback(() => run('silent'), [run]);

  return { data, setData, error, loading, refreshing, refresh, reload };
}
