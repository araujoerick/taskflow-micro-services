import { Link } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { LogOut } from 'lucide-react';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-(--color-border)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-8">
              <Link to="/tasks" className="text-xl font-bold">
                Task Manager
              </Link>
              <div className="flex gap-4">
                <Link to="/tasks" className="text-sm font-medium hover:text-(--color-primary)">
                  Tasks
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <NotificationsDropdown />

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-(--color-muted-foreground)">{user?.email}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => logout.mutate()} title="Logout">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
