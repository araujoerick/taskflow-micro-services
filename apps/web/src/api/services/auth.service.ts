import { apiClient } from '../client';
import type { User, LoginDto, CreateUserDto, AuthResponse } from '@repo/types';

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return data;
  },

  async register(userData: CreateUserDto): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', userData);
    return data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await apiClient.get<{ valid: boolean; user: User }>('/auth/validate');
    return data.user;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },
};
