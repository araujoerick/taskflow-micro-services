import { createContext } from 'react';
import type { User } from '@repo/types';
import type { useLogin, useRegister, useLogout } from '@/hooks/queries/useAuth';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: ReturnType<typeof useLogin>;
  register: ReturnType<typeof useRegister>;
  logout: ReturnType<typeof useLogout>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
