import { createRootRoute, Outlet } from '@tanstack/react-router';
import { QueryProvider } from '@/contexts/QueryProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from '@/components/ui/sonner';

export const Route = createRootRoute({
  component: () => (
    <QueryProvider>
      <AuthProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
          <Toaster />
        </div>
      </AuthProvider>
    </QueryProvider>
  ),
});
