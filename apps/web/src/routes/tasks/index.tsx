import { useState } from 'react';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { TaskFilters } from '@/components/tasks/TaskFilters';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/queries/useTasks';
import type { Task, TaskFilters as TaskFiltersType } from '@repo/types';
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
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

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
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        assignedToId: data.assignedToId || undefined,
      });
      toast.success('Task created successfully');
    } catch {
      toast.error('Failed to create task');
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
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
          assignedToId: data.assignedToId || undefined,
        },
      });
      toast.success('Task updated successfully');
      setEditingTask(null);
    } catch {
      toast.error('Failed to update task');
      throw new Error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    try {
      await deleteTask.mutateAsync(deletingTask.id);
      toast.success('Task deleted successfully');
      setDeletingTask(null);
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleDelete = (task: Task) => {
    setDeletingTask(task);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Manage your tasks and stay organized</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="space-y-6">
        <TaskFilters filters={filters} onFiltersChange={handleFiltersChange} />

        <TaskList
          data={data}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
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
  );
}
