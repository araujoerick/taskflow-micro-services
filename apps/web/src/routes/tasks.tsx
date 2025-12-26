import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useTasks, useCreateTask } from '@/hooks/queries/useTasks';
import { createTaskSchema, type CreateTaskInput } from '@/schemas/task.schema';
import { TaskStatus, TaskPriority, type CreateTaskDto } from '@repo/types';
import {
  taskStatusLabels,
  taskStatusVariants,
  taskPriorityLabels,
  taskPriorityVariants,
} from '@/utils/enum-mappers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search } from 'lucide-react';

export const Route = createFileRoute('/tasks')({
  component: TasksPage,
});

function TasksPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | undefined>();
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data, isLoading } = useTasks({
    page,
    limit: 10,
    search: search || undefined,
    status: statusFilter,
    priority: priorityFilter,
  });

  const createTask = useCreateTask();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    },
  });

  const onSubmit = async (formData: CreateTaskInput) => {
    // Transform form data to DTO format
    const dto: CreateTaskDto = {
      title: formData.title,
      description: formData.description || '',
      status: formData.status,
      priority: formData.priority,
      assignedToId: formData.assignedToId || undefined,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
    };
    await createTask.mutateAsync(dto);
    reset();
    setShowCreateModal(false);
  };

  return (
    <ProtectedRoute>
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tasks</h1>
              <p className="text-(--color-muted-foreground)">Manage and track your tasks</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Filter tasks by status, priority or search</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-(--color-muted-foreground)" />
                  <Input
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select
                  value={statusFilter}
                  onValueChange={(v) =>
                    setStatusFilter(v === 'all' ? undefined : (v as TaskStatus))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.values(TaskStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {taskStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={(v) =>
                    setPriorityFilter(v === 'all' ? undefined : (v as TaskPriority))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.values(TaskPriority).map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {taskPriorityLabels[priority]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter(undefined);
                    setPriorityFilter(undefined);
                    setPage(1);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-4 text-(--color-muted-foreground)">Loading tasks...</p>
            </div>
          ) : !data || data.data.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-(--color-muted-foreground)">
                  No tasks found. Create your first task to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.data.map((task) => (
                <Link key={task.id} to="/tasks/$taskId" params={{ taskId: task.id }}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <CardTitle>{task.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {task.description}
                          </CardDescription>
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
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                disabled={page === data.meta.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to your list. Fill in the details below.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" placeholder="Enter task title" {...register('title')} />
                  {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter task description"
                    {...register('description')}
                    rows={4}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      defaultValue={TaskStatus.TODO}
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
                      defaultValue={TaskPriority.MEDIUM}
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
              </div>

              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createTask.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createTask.isPending}>
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </Layout>
    </ProtectedRoute>
  );
}
