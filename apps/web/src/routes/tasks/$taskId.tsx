import { useState } from 'react';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { TaskDetails } from '@/components/tasks/TaskDetails';
import { TaskComments } from '@/components/tasks/TaskComments';
import { TaskHistory } from '@/components/tasks/TaskHistory';
import { TaskForm } from '@/components/tasks/TaskForm';
import { DeleteTaskDialog } from '@/components/tasks/DeleteTaskDialog';
import { useTask, useUpdateTask, useDeleteTask } from '@/hooks/queries/useTasks';
import type { CreateTaskInput } from '@/schemas/task.schema';

export const Route = createFileRoute('/tasks/$taskId')({
  beforeLoad: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      throw redirect({ to: '/login' });
    }
  },
  component: TaskDetailsPage,
});

function TaskDetailsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const handleUpdateTask = async (data: CreateTaskInput) => {
    try {
      await updateTask.mutateAsync({
        id: taskId,
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
    } catch {
      toast.error('Failed to update task');
      throw new Error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    try {
      await deleteTask.mutateAsync(taskId);
      toast.success('Task deleted successfully');
      navigate({ to: '/tasks' });
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <TaskDetails
          task={task}
          isLoading={isLoading}
          onEdit={() => setIsFormOpen(true)}
          onDelete={() => setIsDeleteOpen(true)}
        />

        {task && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TaskComments taskId={taskId} />
              <TaskHistory taskId={taskId} />
            </div>
          </>
        )}
      </div>

      <TaskForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        task={task}
        onSubmit={handleUpdateTask}
        isLoading={updateTask.isPending}
      />

      <DeleteTaskDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        task={task || null}
        onConfirm={handleDeleteTask}
        isLoading={deleteTask.isPending}
      />
    </div>
  );
}
