import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { createClient, createSupabaseClient, SUPABASE_URL, type Client } from './api';

// Supabase istemcisi uygulama ömrü boyunca tek: oturumu AsyncStorage'da kendi saklar ve yeniler.
const sb = createSupabaseClient();
const api: Client = createClient(sb);

type Session = {
  ready: boolean;
  token: string | null;
  server: string;
  api: Client;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    sb.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setToken(data.session?.access_token ?? null);
      setReady(true);
    });
    // Oturum yenilendiğinde, kapandığında ya da başka bir yerden değiştiğinde tek kaynaktan haber al.
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setReady(true);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await api.login(email, password);
    // onAuthStateChange token'ı zaten yazar; giriş ekranının beklemesi için burada da set edilir.
    const { data } = await sb.auth.getSession();
    setToken(data.session?.access_token ?? null);
  }, []);

  const signOut = useCallback(async () => {
    await api.signOut();
    setToken(null);
  }, []);

  const value = useMemo(
    () => ({ ready, token, server: SUPABASE_URL, api, signIn, signOut }),
    [ready, token, signIn, signOut],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession() {
  const s = useContext(Ctx);
  if (!s) throw new Error('useSession SessionProvider dışında kullanıldı');
  return s;
}
