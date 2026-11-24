import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';
import { authApi } from '../api/endpoints';
import type { AuthResponse, UserProfile } from '../api/types';
import { AuthContext, type AuthContextValue } from './authContext';

const STORAGE_KEY = 'gatherly.auth';

interface StoredAuth {
  token: string;
  expiresAtUtc: string;
  user: UserProfile;
}


function readStored(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed.token || new Date(parsed.expiresAtUtc).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStored(auth: StoredAuth | null) {
  try {
    if (auth) localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable (private mode etc.) — session just won't persist
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [auth, setAuth] = useState<StoredAuth | null>(() => {
    const stored = readStored();
    setAuthToken(stored?.token ?? null);
    return stored;
  });

  const apply = useCallback(
    (next: StoredAuth | null) => {
      setAuthToken(next?.token ?? null);
      writeStored(next);
      setAuth(next);
      // Per-user data (RSVP state, favorites, "mine") must be refetched for the new identity.
      queryClient.removeQueries();
    },
    [queryClient],
  );

  const logout = useCallback(() => apply(null), [apply]);

  const fromResponse = useCallback(
    (res: AuthResponse) => apply({ token: res.accessToken, expiresAtUtc: res.expiresAtUtc, user: res.user }),
    [apply],
  );

  // Sign out when the API rejects our token, and when the token's lifetime runs out.
  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  useEffect(() => {
    if (!auth) return;
    const ms = new Date(auth.expiresAtUtc).getTime() - Date.now();
    const timer = window.setTimeout(logout, Math.max(0, Math.min(ms, 2_147_000_000)));
    return () => window.clearTimeout(timer);
  }, [auth, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: auth?.user ?? null,
      isAuthenticated: !!auth,
      login: async (req) => fromResponse(await authApi.login(req)),
      register: async (req) => fromResponse(await authApi.register(req)),
      logout,
      setUser: (user) => {
        if (!auth) return;
        const next = { ...auth, user };
        writeStored(next);
        setAuth(next);
      },
    }),
    [auth, fromResponse, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
