import { useState, useMemo } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Plus, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import {
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useUpdateTaskStatus,
} from '@/hooks/queries/useTasks';
import { TaskStatus as TaskStatusEnum, TaskPriority } from '@repo/types';
import type { Task, TaskFilters as TaskFiltersType, TaskStatus } from '@repo/types';
import type { CreateTaskInput } from '@/schemas/task.schema';

export const Route = createFileRoute('/tasks/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: TasksPage,
});

function TasksPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
  });
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const queryFilters: TaskFiltersType = {
    page,
    limit: 12,
    ...(filters.search && { search: filters.search }),
    ...(filters.status !== 'all' && { status: filters.status as TaskFiltersType['status'] }),
    ...(filters.priority !== 'all' && {
      priority: filters.priority as TaskFiltersType['priority'],
    }),
  };

  const { data, isLoading } = useTasks(queryFilters);
  // Fetch all tasks for sidebar stats (without pagination filters)
  const { data: allTasksData } = useTasks({ limit: 1000 });
  const allTasks = allTasksData?.data || [];

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const updateTaskStatus = useUpdateTaskStatus();

  const quickStats = useMemo(() => {
    const todo = allTasks.filter((t) => t.status === TaskStatusEnum.TODO).length;
    const inProgress = allTasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length;
    const done = allTasks.filter((t) => t.status === TaskStatusEnum.DONE).length;
    const highPriority = allTasks.filter((t) => t.priority === TaskPriority.HIGH).length;
    return { todo, inProgress, done, highPriority };
  }, [allTasks]);

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

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

  const handleUpdateTask = async (data: CreateTaskInput) => {
    if (!editingTask) return;

    try {
      await updateTask.mutateAsync({
        id: editingTask.id,
        updates: {
          title: data.title,
          description: data.description || '',
          status: data.status,
          priority: data.priority,
          dueDate: data.dueDate || undefined,
          assignedToId: data.assignedToId || undefined,
        },
      });
      toast.success('Tarefa atualizada com sucesso');
      setEditingTask(null);
    } catch (error) {
      // Extrair mensagem de erro da API
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError.response?.status === 403) {
        toast.error('Apenas o criador pode editar esta tarefa');
      } else {
        toast.error('Falha ao atualizar tarefa');
      }
      throw new Error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await deleteTask.mutateAsync(deletingTask.id);
      toast.success('Tarefa excluída com sucesso');
      setDeletingTask(null);
    } catch (error) {
      // Extrair mensagem de erro da API
      const axiosError = error as { response?: { data?: { message?: string }; status?: number } };
      if (axiosError.response?.status === 403) {
        toast.error('Apenas o criador pode excluir esta tarefa');
      } else {
        toast.error('Falha ao excluir tarefa');
      }
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (task: Task) => {
    setDeletingTask(task);
  };

  const handleStatusChange = async (task: Task, status: TaskStatus) => {
    try {
      await updateTaskStatus.mutateAsync({ id: task.id, status });
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 403) {
        toast.error('Você não tem permissão para alterar o status desta tarefa');
      } else {
        toast.error('Falha ao atualizar status');
      }
    }
  };

  return (
    <div className="organic-background min-h-screen">
      {/* Accent blob */}
      <div className="organic-blob-accent" />
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="organic-page-header">
          <div>
            <h1 className="organic-page-title">Tarefas</h1>
            <p className="organic-page-subtitle">Gerencie suas tarefas e mantenha-se organizado</p>
          </div>
          <Button
            onClick={() => setIsFormOpen(true)}
            className="organic-button organic-button-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Tarefa
          </Button>
        </div>

        {/* Two-column layout */}
        <div className="tasks-page-grid">
          {/* Main Content - Tasks */}
          <div className="tasks-main-content">
            <TaskFilters filters={filters} onFiltersChange={handleFiltersChange} />

            <TaskList
              data={data}
              isLoading={isLoading}
              page={page}
              onPageChange={setPage}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
            />
          </div>

          {/* Sidebar - Clock, Calendar, Summary */}
          <div className="tasks-sidebar">
            <DigitalClock />

            <MiniCalendar tasks={allTasks} />

            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="quick-stats-title">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Resumo
              </div>
              <div className="quick-stats-grid">
                <div className="quick-stat-item">
                  <div className="quick-stat-value text-amber-600">{quickStats.todo}</div>
                  <div className="quick-stat-label">Pendentes</div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-value text-purple-600">{quickStats.inProgress}</div>
                  <div className="quick-stat-label">Em progresso</div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-value text-green-600">{quickStats.done}</div>
                  <div className="quick-stat-label">Concluídas</div>
                </div>
                <div className="quick-stat-item">
                  <div className="quick-stat-value text-red-600">{quickStats.highPriority}</div>
                  <div className="quick-stat-label">Alta prioridade</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <TaskForm
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingTask(null);
          }}
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          isLoading={createTask.isPending || updateTask.isPending}
        />

        <DeleteTaskDialog
          open={!!deletingTask}
          onOpenChange={(open) => !open && setDeletingTask(null)}
          task={deletingTask}
          onConfirm={handleDeleteTask}
          isLoading={deleteTask.isPending}
        />
      </div>
    </div>
  );
}
