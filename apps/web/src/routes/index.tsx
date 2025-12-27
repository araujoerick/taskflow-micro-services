import { createFileRoute, redirect } from '@tanstack/react-router';
import { useTasks } from '@/hooks/queries/useTasks';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { PriorityChart } from '@/components/dashboard/PriorityChart';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  // Fetch all tasks without pagination for dashboard stats
  const { data, isLoading } = useTasks({ limit: 1000 });
  const tasks = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your tasks and progress</p>
      </div>

      <div className="space-y-8">
        <StatsCards tasks={tasks} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusChart tasks={tasks} isLoading={isLoading} />
          <PriorityChart tasks={tasks} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
