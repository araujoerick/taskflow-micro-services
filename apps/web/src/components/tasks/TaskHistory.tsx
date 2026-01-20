import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Plus, Edit, UserPlus, MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskHistory } from '@/hooks/queries/useTasks';
import { formatRelativeTime } from '@/utils/date-formatters';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';
import { TaskAction, TaskStatus, TaskPriority } from '@repo/types';
import { authService, type UserBasicInfo } from '@/api/services/auth.service';

interface TaskHistoryProps {
  taskId: string;
}

const actionIcons: Record<TaskAction, typeof Plus> = {
  [TaskAction.CREATED]: Plus,
  [TaskAction.UPDATED]: Edit,
  [TaskAction.STATUS_CHANGED]: ArrowRight,
  [TaskAction.ASSIGNED]: UserPlus,
  [TaskAction.COMMENTED]: MessageSquare,
};

const actionLabels: Record<TaskAction, string> = {
  [TaskAction.CREATED]: 'criou a tarefa',
  [TaskAction.UPDATED]: 'atualizou a tarefa',
  [TaskAction.STATUS_CHANGED]: 'alterou o status',
  [TaskAction.ASSIGNED]: 'atribuiu a tarefa',
  [TaskAction.COMMENTED]: 'adicionou um comentário',
};

const fieldLabels: Record<string, string> = {
  title: 'Título',
  description: 'Descrição',
  status: 'Status',
  priority: 'Prioridade',
  dueDate: 'Data de Vencimento',
  assignedTo: 'Atribuído para',
};

const displayableFields = ['title', 'description', 'status', 'priority', 'dueDate'];

function formatChangeValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return 'Nenhum';
  if (key === 'dueDate' && typeof value === 'string') {
    return new Date(value).toLocaleDateString('pt-BR');
  }
  if (key === 'status' && typeof value === 'string') {
    return taskStatusLabels[value as TaskStatus] || value;
  }
  if (key === 'priority' && typeof value === 'string') {
    return taskPriorityLabels[value as TaskPriority] || value;
  }
  if (typeof value === 'object') return '';
  return String(value);
}

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const { data: history, isLoading } = useTaskHistory(taskId);

  // Get unique user IDs from history
  const userIds = useMemo(() => {
    if (!history) return [];
    return [...new Set(history.map((h) => h.userId))];
  }, [history]);

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

  const getUserName = (userId: string): string => {
    const user = usersMap.get(userId);
    return user?.name || 'Usuário';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Atividade
        </h3>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Atividade
        </h3>
        <div className="text-center py-8 text-muted-foreground text-sm">Nenhuma atividade ainda</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <History className="h-4 w-4" />
        Atividade ({history.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

        <div className="space-y-4">
          {history.map((item) => {
            const Icon = actionIcons[item.action] || Edit;
            const label = actionLabels[item.action] || 'fez alterações';

            // Check if there are displayable changes
            const hasDisplayableChanges = item.changes &&
              Object.entries(item.changes).some(([key, value]) =>
                displayableFields.includes(key) && formatChangeValue(key, value)
              );

            return (
              <div key={item.id} className="relative flex gap-4 pl-1">
                <div className="relative z-10 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 pt-1">
                  <p className="text-sm">
                    <span className="font-medium">{getUserName(item.userId)}</span>{' '}
                    <span className="text-muted-foreground">{label}</span>
                  </p>

                  {hasDisplayableChanges && (
                    <Card className="mt-2 p-3 text-xs">
                      {Object.entries(item.changes)
                        .filter(([key]) => displayableFields.includes(key))
                        .map(([key, value]) => {
                          const formattedValue = formatChangeValue(key, value);
                          if (!formattedValue) return null;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="font-medium">{fieldLabels[key] || key}:</span>
                              <span className="text-muted-foreground">{formattedValue}</span>
                            </div>
                          );
                        })}
                    </Card>
                  )}

                  <p className="text-xs text-muted-foreground mt-1">
                    {formatRelativeTime(item.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
