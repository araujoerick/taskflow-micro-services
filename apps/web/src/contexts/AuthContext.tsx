import { useCurrentUser, useLogin, useRegister, useLogout } from '@/hooks/queries/useAuth';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, status } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const hasToken = !!localStorage.getItem('accessToken');

  // If there's a token, we're loading until the query succeeds or fails
  // If there's no token, we're not loading and not authenticated
  const actualIsLoading = hasToken ? (status === 'pending' || isLoading) : false;
  const isAuthenticated = hasToken && !!user;

  console.log('AuthProvider - hasToken:', hasToken, 'user:', !!user, 'actualIsLoading:', actualIsLoading, 'isAuthenticated:', isAuthenticated);

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading: actualIsLoading,
        isAuthenticated,
        login: loginMutation,
        register: registerMutation,
        logout: logoutMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
