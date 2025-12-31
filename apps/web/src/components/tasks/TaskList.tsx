import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
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

export function TaskList({
  data,
  isLoading,
  page,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange,
}: TaskListProps) {
  const tasks = useMemo(() => data?.data || [], [data?.data]);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-card rounded-[1.25rem] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-black/3 dark:border-border"
          >
            <Skeleton className="h-5 w-3/4 mb-3 rounded-full" />
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full mb-2 rounded-full" />
            <Skeleton className="h-4 w-2/3 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border h-full flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center mb-4">
          <ListTodo className="h-10 w-10 text-purple-400" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Nenhuma tarefa encontrada</h3>
        <p className="text-muted-foreground text-sm">Crie sua primeira tarefa para começar</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
          <button
            className="w-10 h-10 rounded-full bg-white dark:bg-card border border-black/6 dark:border-border flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-purple-500 hover:text-white hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-current disabled:hover:border-black/6"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-4 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>

          <button
            className="w-10 h-10 rounded-full bg-white dark:bg-card border border-black/6 dark:border-border flex items-center justify-center transition-all duration-200 cursor-pointer hover:bg-purple-500 hover:text-white hover:border-purple-500 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-current disabled:hover:border-black/6"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
