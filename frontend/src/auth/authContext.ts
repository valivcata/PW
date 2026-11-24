import { createContext } from 'react';
import type { LoginRequest, RegisterRequest, UserProfile } from '../api/types';

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (req: LoginRequest) => Promise<void>;
  register: (req: RegisterRequest) => Promise<void>;
  logout: () => void;
  setUser: (user: UserProfile) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
