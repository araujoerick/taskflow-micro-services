import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@/contexts/AuthContext'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    </AuthProvider>
  ),
})
