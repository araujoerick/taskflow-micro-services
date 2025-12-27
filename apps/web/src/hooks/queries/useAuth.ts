import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/services/auth.service';
import { queryKeys } from '@/utils/query-keys';
import { useAuth } from '@/contexts/AuthContext';
import type { LoginDto, CreateUserDto } from '@repo/types';

export function useLogin() {
  const { login } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginDto) => authService.login(credentials),
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (userData: CreateUserDto) => authService.register(userData),
  });
}

export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logout();
      queryClient.clear();
    },
    onError: () => {
      logout();
      queryClient.clear();
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
