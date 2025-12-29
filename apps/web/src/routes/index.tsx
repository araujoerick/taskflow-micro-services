import { useState, useMemo } from 'react';
import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { Plus, ArrowRight, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useTasks, useCreateTask } from '@/hooks/queries/useTasks';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { PriorityChart } from '@/components/dashboard/PriorityChart';
import { TaskForm } from '@/components/tasks/TaskForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  taskStatusLabels,
  taskStatusVariants,
  taskPriorityLabels,
  taskPriorityVariants,
} from '@/utils/enum-mappers';
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

function DashboardPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Fetch all tasks without pagination for dashboard stats
  const { data, isLoading } = useTasks({ limit: 1000 });
  const tasks = data?.data || [];
  const createTask = useCreateTask();

  // Get 4 most recent tasks
  const recentTasks = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
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
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral das suas tarefas e progresso</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Tarefa
        </Button>
      </div>

      <div className="space-y-8">
        <StatsCards tasks={tasks} isLoading={isLoading} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatusChart tasks={tasks} isLoading={isLoading} />
          <PriorityChart tasks={tasks} isLoading={isLoading} />
        </div>

        {/* Recent Tasks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tarefas Recentes
            </CardTitle>
            <Link to="/tasks">
              <Button variant="ghost" size="sm">
                Ver todas
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma tarefa ainda.</p>
                <Button variant="link" className="mt-2" onClick={() => setIsFormOpen(true)}>
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
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatRelativeTime(task.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        variant={
                          taskStatusVariants[task.status] as
                            | 'default'
                            | 'secondary'
                            | 'destructive'
                            | 'outline'
                        }
                      >
                        {taskStatusLabels[task.status]}
                      </Badge>
                      <Badge
                        variant={
                          taskPriorityVariants[task.priority] as
                            | 'default'
                            | 'secondary'
                            | 'destructive'
                            | 'outline'
                        }
                      >
                        {taskPriorityLabels[task.priority]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreateTask}
        isLoading={createTask.isPending}
      />
    </div>
  );
}
