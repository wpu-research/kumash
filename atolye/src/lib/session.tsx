import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { createClient, DEFAULT_SERVER, type Client } from './api';

// Oturum anahtarı telefonda güvenli depoda (Keychain / Keystore) tutulur; web önizlemesinde localStorage.
const store = {
  async get(k: string) {
    if (Platform.OS !== 'web') return SecureStore.getItemAsync(k);
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  async set(k: string, v: string | null) {
    if (Platform.OS !== 'web') return v == null ? SecureStore.deleteItemAsync(k) : SecureStore.setItemAsync(k, v);
    try {
      if (v == null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {}
  },
};

type Session = {
  ready: boolean;
  token: string | null;
  server: string;
  api: Client;
  signIn: (server: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [server, setServer] = useState(DEFAULT_SERVER);

  useEffect(() => {
    (async () => {
      const [t, s] = await Promise.all([store.get('token'), store.get('server')]);
      if (s) setServer(s);
      setToken(t);
      setReady(true);
    })();
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    await store.set('token', null);
  }, []);

  const signIn = useCallback(async (srv: string, password: string) => {
    const clean = srv.trim().replace(/\/+$/, '') || DEFAULT_SERVER;
    const res = await createClient(clean, null, () => {}).login(password);
    await Promise.all([store.set('token', res.token), store.set('server', clean)]);
    setServer(clean);
    setToken(res.token);
  }, []);

  const api = useMemo(() => createClient(server, token, () => void signOut()), [server, token, signOut]);

  return <Ctx.Provider value={{ ready, token, server, api, signIn, signOut }}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession SessionProvider dışında kullanıldı');
  return s;
}
