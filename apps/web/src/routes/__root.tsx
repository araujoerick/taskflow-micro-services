import { createRootRoute, Outlet } from '@tanstack/react-router'
import { AuthProvider } from '@/contexts/AuthContext'
import { NotificationsProvider } from '@/contexts/NotificationsContext'

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <NotificationsProvider>
        <div className="min-h-screen bg-background">
          <Outlet />
        </div>
      </NotificationsProvider>
    </AuthProvider>
  ),
})
