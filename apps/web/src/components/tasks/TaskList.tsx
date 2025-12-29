import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { TaskCard } from './TaskCard';
import { ListTodo, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task, PaginatedResponse, TaskStatus } from '@repo/types';
import { authService, type UserBasicInfo } from '@/api/services/auth.service';

interface TaskListProps {
  data: PaginatedResponse<Task> | undefined;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange?: (task: Task, status: TaskStatus) => void;
}

export function TaskList({ data, isLoading, page, onPageChange, onEdit, onDelete, onStatusChange }: TaskListProps) {
  const tasks = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;

  // Get unique user IDs from tasks (creators and assignees)
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => {
      ids.add(t.createdBy);
      if (t.assignedTo) {
        ids.add(t.assignedTo);
      }
    });
    return [...ids];
  }, [tasks]);

  const { data: users } = useQuery({
    queryKey: ['users', userIds],
    queryFn: () => authService.getUsersByIds(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserBasicInfo>();
    users?.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const getUserName = (userId: string | undefined): string | undefined => {
    if (!userId) return undefined;
    return usersMap.get(userId)?.name;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-5 w-3/4 mb-3" />
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <ListTodo className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-1">Nenhuma tarefa encontrada</h3>
        <p className="text-muted-foreground text-sm">Crie sua primeira tarefa para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
            creatorName={getUserName(task.createdBy)}
            assigneeName={getUserName(task.assignedTo)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-muted-foreground px-4">
            Página {page} de {totalPages}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
