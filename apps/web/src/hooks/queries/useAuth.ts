import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/api/services/auth.service';
import { queryKeys } from '@/utils/query-keys';
import type { LoginDto, CreateUserDto } from '@repo/types';
import { toast } from 'sonner';

export function useCurrentUser() {
  const hasToken = !!localStorage.getItem('accessToken');

  const query = useQuery({
    queryKey: queryKeys.auth.me(),
    queryFn: authService.getCurrentUser,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log('useCurrentUser - hasToken:', hasToken, 'data:', query.data, 'isLoading:', query.isLoading, 'status:', query.status);

  return query;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginDto) => authService.login(credentials),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      // Force refetch to update enabled state
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Login successful!');
    },
    onError: () => {
      toast.error('Invalid credentials');
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserDto) => authService.register(userData),
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      queryClient.setQueryData(queryKeys.auth.me(), data.user);
      // Force refetch to update enabled state
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me() });
      toast.success('Registration successful!');
    },
    onError: () => {
      toast.error('Registration failed');
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      localStorage.clear();
      queryClient.clear();
      window.location.href = '/login';
    },
  });
}
