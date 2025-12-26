import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import {
  useTask,
  useTaskComments,
  useTaskHistory,
  useUpdateTask,
  useDeleteTask,
  useAddComment,
} from '@/hooks/queries/useTasks';
import {
  updateTaskSchema,
  commentSchema,
  type UpdateTaskInput,
  type CommentInput,
} from '@/schemas/task.schema';
import { TaskStatus, TaskPriority, type UpdateTaskDto } from '@repo/types';
import {
  taskStatusLabels,
  taskStatusVariants,
  taskPriorityLabels,
  taskPriorityVariants,
} from '@/utils/enum-mappers';
import { formatDateTime } from '@/utils/date-formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, Clock, Edit, Trash2 } from 'lucide-react';

export const Route = createFileRoute('/tasks/$taskId')({
  component: TaskDetailsPage,
});

function TaskDetailsPage() {
  const { taskId } = Route.useParams();
  const navigate = useNavigate();

  console.log('TaskDetailsPage - Rendering with taskId:', taskId);

  const { data: task, isLoading } = useTask(taskId);
  const { data: comments } = useTaskComments(taskId);
  const { data: history } = useTaskHistory(taskId);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const addComment = useAddComment();

  const [editMode, setEditMode] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
  });

  const {
    register: registerComment,
    handleSubmit: handleSubmitComment,
    reset: resetComment,
    formState: { errors: commentErrors },
  } = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
  });

  const onUpdateTask = async (data: UpdateTaskInput) => {
    // Transform form data to DTO format
    const dto: UpdateTaskDto = {
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assignedToId: data.assignedToId || undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    await updateTask.mutateAsync({ id: taskId, updates: dto });
    setEditMode(false);
  };

  const onDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    await deleteTask.mutateAsync(taskId);
    navigate({ to: '/tasks' });
  };

  const onAddComment = async (data: CommentInput) => {
    await addComment.mutateAsync({ taskId, content: data.content });
    resetComment();
  };

  const handleEnterEditMode = () => {
    if (task) {
      reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
      });
      setEditMode(true);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <Layout>
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
            <p className="mt-4 text-(--color-muted-foreground)">Loading task...</p>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <Layout>
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-(--color-muted-foreground)">Task not found</p>
            </CardContent>
          </Card>
        </Layout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/tasks' })}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Task Details</h1>
              <p className="text-(--color-muted-foreground)">View and manage task information</p>
            </div>
            {!editMode && (
              <div className="flex gap-2">
                <Button onClick={handleEnterEditMode}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={onDeleteTask}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  {editMode ? (
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" {...register('title')} placeholder="Task title" />
                      {errors.title && (
                        <p className="text-sm text-red-500">{errors.title.message}</p>
                      )}
                    </div>
                  ) : (
                    <CardTitle>{task.title}</CardTitle>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Badge variant={taskStatusVariants[task.status]}>
                    {taskStatusLabels[task.status]}
                  </Badge>
                  <Badge variant={taskPriorityVariants[task.priority]}>
                    {taskPriorityLabels[task.priority]}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <form onSubmit={handleSubmit(onUpdateTask)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Task description"
                      rows={4}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        defaultValue={task.status}
                        onValueChange={(value) => setValue('status', value as TaskStatus)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TaskStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {taskStatusLabels[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select
                        defaultValue={task.priority}
                        onValueChange={(value) => setValue('priority', value as TaskPriority)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TaskPriority).map((priority) => (
                            <SelectItem key={priority} value={priority}>
                              {taskPriorityLabels[priority]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateTask.isPending}>
                      {updateTask.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-(--color-muted-foreground)">{task.description}</p>
                  <div className="flex gap-4 text-sm text-(--color-muted-foreground)">
                    <span>Created: {formatDateTime(task.createdAt)}</span>
                    <span>Updated: {formatDateTime(task.updatedAt)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Comments ({comments?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleSubmitComment(onAddComment)} className="space-y-2">
                  <Textarea
                    {...registerComment('content')}
                    placeholder="Add a comment..."
                    rows={3}
                  />
                  {commentErrors.content && (
                    <p className="text-sm text-red-500">{commentErrors.content.message}</p>
                  )}
                  <Button type="submit" size="sm" disabled={addComment.isPending}>
                    {addComment.isPending ? 'Adding...' : 'Add Comment'}
                  </Button>
                </form>

                <div className="space-y-3">
                  {!comments || comments.length === 0 ? (
                    <p className="text-sm text-(--color-muted-foreground) text-center py-4">
                      No comments yet
                    </p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border rounded-md p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">User {comment.userId}</span>
                          <span className="text-xs text-(--color-muted-foreground)">
                            {formatDateTime(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  History ({history?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {!history || history.length === 0 ? (
                    <p className="text-sm text-(--color-muted-foreground) text-center py-4">
                      No history yet
                    </p>
                  ) : (
                    history.map((entry) => (
                      <div
                        key={entry.id}
                        className="border-l-2 border-(--color-border) pl-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{entry.action}</span>
                          <span className="text-xs text-(--color-muted-foreground)">
                            {formatDateTime(entry.createdAt)}
                          </span>
                        </div>
                        {entry.changes && (
                          <p className="text-sm text-(--color-muted-foreground)">
                            {JSON.stringify(entry.changes)}
                          </p>
                        )}
                        <p className="text-xs text-(--color-muted-foreground)">
                          by User {entry.userId}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
}
