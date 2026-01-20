import { apiClient } from '../client';
import type { User, LoginDto, CreateUserDto, AuthResponse } from '@repo/types';

export interface UserBasicInfo {
  id: string;
  name: string;
  email: string;
}

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

  async getUsersByIds(ids: string[]): Promise<UserBasicInfo[]> {
    if (ids.length === 0) return [];
    const { data } = await apiClient.get<UserBasicInfo[]>(`/auth/users?ids=${ids.join(',')}`);
    return data;
  },

  async getAllUsers(): Promise<UserBasicInfo[]> {
    const { data } = await apiClient.get<UserBasicInfo[]>('/auth/users/all');
    return data;
  },
};
