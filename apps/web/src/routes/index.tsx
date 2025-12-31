import { useState, useMemo } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, useCreateTask } from '@/hooks/queries/useTasks';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { TaskForm } from '@/components/tasks/TaskForm';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';
import { TaskStatus, TaskPriority } from '@repo/types';
import { formatRelativeTime } from '@/utils/date-formatters';
import type { CreateTaskInput } from '@/schemas/task.schema';

export const Route = createFileRoute('/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: DashboardPage,
});

const badgeBase = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';

const statusBadgeStyles = {
  [TaskStatus.TODO]: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400`,
  [TaskStatus.IN_PROGRESS]: `${badgeBase} bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400`,
  [TaskStatus.DONE]: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400`,
};

const priorityBadgeStyles = {
  [TaskPriority.LOW]: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400`,
  [TaskPriority.MEDIUM]: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400`,
  [TaskPriority.HIGH]: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400`,
};

function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch all tasks without pagination for dashboard stats
  const { data, isLoading } = useTasks({ limit: 1000 });
  const tasks = useMemo(() => data?.data || [], [data?.data]);
  const createTask = useCreateTask();

  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [tasks]);

  const handleCreateTask = async (data: CreateTaskInput) => {
    try {
      await createTask.mutateAsync({
        title: data.title,
        description: data.description || '',
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate || undefined,
        assignedToId: data.assignedToId || undefined,
      });
      toast.success('Tarefa criada com sucesso');
    } catch {
      toast.error('Falha ao criar tarefa');
      throw new Error('Failed to create task');
    }
  };

  return (
    <div className="relative min-h-full overflow-x-hidden before:content-[''] before:fixed before:w-[600px] before:h-[600px] before:bg-blue-500 before:rounded-full before:-z-10 before:pointer-events-none before:opacity-[0.12] before:-top-[200px] before:-right-[150px] before:blur-[80px] after:content-[''] after:fixed after:w-[500px] after:h-[500px] after:bg-purple-500 after:rounded-full after:-z-10 after:pointer-events-none after:opacity-[0.12] after:-bottom-[150px] after:-left-[100px] after:blur-[80px]">
      <div className="fixed w-[400px] h-[400px] bg-amber-500 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[100px] opacity-[0.06] -z-10 pointer-events-none" />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8 max-w-7xl">
        <PageHeader
          title="Dashboard"
          subtitle="Visão geral das suas tarefas e progresso"
          onNewTask={() => setIsFormOpen(true)}
        />

        {/* Stats Cards */}
        <StatsCards tasks={tasks} isLoading={isLoading} />

        {/* Main Grid: Content + Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6 mt-6">
          {/* Main Content */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* Recent Tasks Section */}
            <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-500" />
                  Tarefas Recentes
                </div>
                <Link to="/tasks">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-full hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20"
                  >
                    Ver todas
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-card rounded-2xl py-3.5 px-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-black/3 dark:border-border flex items-center justify-between gap-4"
                    >
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48 rounded-full" />
                        <Skeleton className="h-3 w-24 rounded-full" />
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-20 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="mb-2">Nenhuma tarefa ainda.</p>
                  <Button
                    variant="link"
                    className="text-purple-600"
                    onClick={() => setIsFormOpen(true)}
                  >
                    Criar sua primeira tarefa
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <Link
                      key={task.id}
                      to="/tasks/$taskId"
                      params={{ taskId: task.id }}
                      className="bg-white dark:bg-card rounded-2xl py-3.5 px-4 shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-black/3 dark:border-border flex items-center justify-between gap-4 transition-all duration-200 hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] hover:translate-x-1"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(task.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className={statusBadgeStyles[task.status]}>
                          {taskStatusLabels[task.status]}
                        </span>
                        <span className={priorityBadgeStyles[task.priority]}>
                          {taskPriorityLabels[task.priority]}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="gap-4 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            <div className="max-md:row-span-2 gap-4 flex flex-col my-auto">
              <DigitalClock />
              <ActivityHeatmap tasks={tasks} />
            </div>
            <MiniCalendar tasks={tasks} />
          </div>
        </div>

        <TaskForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleCreateTask}
          isLoading={createTask.isPending}
        />
      </div>
    </div>
  );
}
