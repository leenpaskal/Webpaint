import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError } from '@/lib/api/client';
import { fetchMe, login as loginApi } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/types';
import {
  clearToken,
  loadToken,
  saveToken,
} from '@/lib/auth/token-storage';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // On mount, restore any stored token and verify it against /auth/me.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadToken();
      if (!stored) {
        if (!cancelled) setStatus('unauthenticated');
        return;
      }
      try {
        const { user: me } = await fetchMe(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(me);
        setStatus('authenticated');
      } catch (err) {
        // Invalid/expired token — wipe it.
        await clearToken();
        if (cancelled) return;
        if (err instanceof ApiError && err.status !== 0) {
          // 401 / 403 → just stay logged out silently.
        }
        setStatus('unauthenticated');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: newToken, user: newUser } = await loginApi(email, password);
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, token, login, logout }),
    [status, user, token, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an <AuthProvider>.');
  }
  return ctx;
}
