import { useState, useMemo } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { Plus, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, useCreateTask } from '@/hooks/queries/useTasks';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { TaskForm } from '@/components/tasks/TaskForm';
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

function getStatusBadgeClass(status: TaskStatus): string {
  switch (status) {
    case TaskStatus.TODO:
      return 'organic-badge status-pending';
    case TaskStatus.IN_PROGRESS:
      return 'organic-badge status-progress';
    case TaskStatus.DONE:
      return 'organic-badge status-done';
    default:
      return 'organic-badge';
  }
}

function getPriorityBadgeClass(priority: TaskPriority): string {
  switch (priority) {
    case TaskPriority.LOW:
      return 'organic-badge priority-low';
    case TaskPriority.MEDIUM:
      return 'organic-badge priority-medium';
    case TaskPriority.HIGH:
      return 'organic-badge priority-high';
    default:
      return 'organic-badge';
  }
}

function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch all tasks without pagination for dashboard stats
  const { data, isLoading } = useTasks({ limit: 1000 });
  const tasks = data?.data || [];
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
    <div className="organic-background min-h-screen">
      <div className="organic-blob-accent" />

      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Header with Clock */}
        <div className="organic-page-header">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
            <div>
              <h1 className="organic-page-title">Dashboard</h1>
              <p className="organic-page-subtitle">Visão geral das suas tarefas e progresso</p>
            </div>
            <div className="sm:ml-auto">
              <DigitalClock />
            </div>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="organic-button organic-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Stats Cards */}
        <StatsCards tasks={tasks} isLoading={isLoading} />

        {/* Main Grid: Content + Sidebar */}
        <div className="dashboard-grid mt-6">
          {/* Main Content */}
          <div className="dashboard-main">
            {/* Recent Tasks Section */}
            <div className="organic-chart-container">
              <div className="flex items-center justify-between mb-4">
                <div className="organic-chart-title">
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
                    <div key={i} className="organic-recent-task">
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
                      className="organic-recent-task"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatRelativeTime(task.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <span className={getStatusBadgeClass(task.status)}>
                          {taskStatusLabels[task.status]}
                        </span>
                        <span className={getPriorityBadgeClass(task.priority)}>
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
          <div className="dashboard-sidebar">
            <MiniCalendar tasks={tasks} />
            <ActivityHeatmap tasks={tasks} />
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
