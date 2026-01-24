import { useState, useMemo, useEffect } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { BarChart3, LayoutGrid, Columns3 } from 'lucide-react';
import { toast } from 'sonner';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskList } from '@/components/tasks/TaskList';
import { KanbanBoard } from '@/components/tasks/KanbanBoard';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { DigitalClock } from '@/components/dashboard/DigitalClock';
import { MiniCalendar } from '@/components/dashboard/MiniCalendar';
import { MobileWeekCalendar } from '@/components/dashboard/MobileWeekCalendar';
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
import { NewTaskButton } from '@/components/NewTaskButton';
import { useNewTaskModal } from '@/contexts/NewTaskModalContext';

export const Route = createFileRoute('/tasks/')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: TasksPage,
});

type ViewMode = 'grid' | 'kanban';

function TasksPage() {
  const { isOpen: isFormOpen, setIsOpen: setIsFormOpen, openModal } = useNewTaskModal();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('taskViewMode');
    return (saved as ViewMode) || 'grid';
  });

  useEffect(() => {
    localStorage.setItem('taskViewMode', viewMode);
  }, [viewMode]);

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
  });
  const [page, setPage] = useState(1);

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
  const { data: allTasksData } = useTasks({ limit: 1000 });
  const allTasks = useMemo(() => allTasksData?.data || [], [allTasksData?.data]);

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
    <div className="relative min-h-full overflow-x-hidden before:content-[''] before:fixed before:w-[600px] before:h-[600px] before:bg-blue-500 before:rounded-full before:-z-10 before:pointer-events-none before:opacity-[0.12] before:-top-[200px] before:-right-[150px] before:blur-[80px] after:content-[''] after:fixed after:w-[500px] after:h-[500px] after:bg-purple-500 after:rounded-full after:-z-10 after:pointer-events-none after:opacity-[0.12] after:-bottom-[150px] after:-left-[100px] after:blur-[80px]">
      {/* Mobile Week Calendar */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-30">
        <MobileWeekCalendar tasks={allTasks} />
      </div>

      {/* Accent blob */}
      <div className="fixed w-[400px] h-[400px] bg-amber-500 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-[100px] opacity-[0.06] -z-10 pointer-events-none" />
      <div className="container mx-auto px-4 pt-36 md:pt-8 py-8 pb-24 md:pb-8 max-w-7xl">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-6">
          {/* Main Content - Tasks */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* Filters + View Toggle */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <TaskFilters filters={filters} onFiltersChange={handleFiltersChange} />
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-white dark:bg-card rounded-xl p-1 shadow-sm border border-black/5 dark:border-border self-start">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'kanban'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Columns3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>
              </div>
            </div>

            {/* Task Views */}
            {viewMode === 'grid' ? (
              <TaskList
                data={data}
                isLoading={isLoading}
                page={page}
                onPageChange={setPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <KanbanBoard
                tasks={allTasks}
                onStatusChange={handleStatusChange}
              />
            )}
          </div>

          {/* Sidebar - Clock, Calendar, Summary */}
          <div className="flex flex-col gap-4 max-md:grid max-lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
            <div className="hidden md:grid grid-cols-[1fr_auto] gap-4">
              <DigitalClock />
              <NewTaskButton onNewTask={openModal} />
            </div>

            <div className="hidden md:block">
              <MiniCalendar tasks={allTasks} />
            </div>

            {/* Quick Stats */}
            <div className="hidden md:block bg-white dark:bg-card rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                Resumo
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold leading-none text-amber-600">
                    {quickStats.todo}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1 uppercase">
                    Pendentes
                  </div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold leading-none text-purple-600">
                    {quickStats.inProgress}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1 uppercase">
                    Em progresso
                  </div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold leading-none text-green-600">
                    {quickStats.done}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1 uppercase">
                    Concluídas
                  </div>
                </div>
                <div className="text-center p-3 rounded-xl bg-secondary">
                  <div className="text-2xl font-bold leading-none text-red-600">
                    {quickStats.highPriority}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground mt-1 uppercase">
                    Alta prioridade
                  </div>
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
