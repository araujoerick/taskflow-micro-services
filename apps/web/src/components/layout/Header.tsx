import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';
import { NotificationsDropdown } from '@/components/NotificationsDropdown';
import { useNewTaskModal } from '@/contexts/NewTaskModalContext';
import { NewTaskButton } from '../NewTaskButton';

const navItems = [
  { to: '/', label: 'Início', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tarefas', icon: ListTodo },
] as const;

function MobileNavBackground() {
  return (
    <div className="absolute inset-0 flex items-end">
      {/* Left SIde */}
      <div className="flex-1 h-full bg-card border-t border-border" />

      {/* Center */}
      <div className="relative w-[110px] h-full text-card">
        <svg
          viewBox="0 0 110 64"
          className="absolute top-0 left-0 w-full h-full"
          preserveAspectRatio="none"
          fill="currentColor"
        >
          <path d="M 0 0 C 15 0 21 0 24 10 C 26 18 37 35 55 35 C 74 35 83 21 87 10 C 90 0 95 0 110 0 L 110 64 L 0 64 Z" />
        </svg>
        {/* Top Border */}
        <svg
          viewBox="0 0 110 64"
          className="absolute top-0 left-0 w-full h-full fill-none stroke-border"
          preserveAspectRatio="none"
          strokeWidth="2"
        >
          <path d="M 0 0 C 15 0 21 0 24 10 C 26 18 37 35 55 35 C 74 35 83 21 87 10 C 90 0 95 0 110 0" />
        </svg>
      </div>

      {/* Right Side */}
      <div className="flex-1 h-full bg-card border-t border-border" />
    </div>
  );
}

export function Header() {
  const location = useLocation();
  const { openModal } = useNewTaskModal();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 md:border-b bg-(--organic-blue) md:bg-card">
      <div className="container h-full mx-auto px-4 flex items-center justify-between">
        {/* Logo & Navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-white ring-1 ring-offset-1 ring-white md:ring-0 md:ring-offset-0 ring-(organic-blue) md:bg-inherit overflow-hidden">
              <img
                src="./logoonly.png"
                alt="TaskFlow logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-bold text-xl hidden sm:inline text-white md:text-primary">
              TaskFlow
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const isActive =
                location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

              return (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <NotificationsDropdown />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 h-16">
        <MobileNavBackground />

        {/* Floating center button */}
        <NewTaskButton variant="circular" onNewTask={openModal} />

        {/* Navigation Items */}
        <nav className="relative z-10 h-full flex items-center">
          <div className="flex-1 flex justify-center">
            <Link
              to="/"
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 transition-colors',
                location.pathname === '/'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase">Início</span>
            </Link>
          </div>

          {/* Central divider */}
          <div className="w-[110px] shrink-0" />

          <div className="flex-1 flex justify-center">
            <Link
              to="/tasks"
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 transition-colors',
                location.pathname.startsWith('/tasks')
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <ListTodo className="h-5 w-5" />
              <span className="text-[10px] font-bold uppercase">Tarefas</span>
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
