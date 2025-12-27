import { History, Plus, Edit, UserPlus, MessageSquare, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTaskHistory } from '@/hooks/queries/useTasks';
import { formatRelativeTime } from '@/utils/date-formatters';
import { TaskAction } from '@repo/types';

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
  [TaskAction.CREATED]: 'created the task',
  [TaskAction.UPDATED]: 'updated the task',
  [TaskAction.STATUS_CHANGED]: 'changed the status',
  [TaskAction.ASSIGNED]: 'assigned the task',
  [TaskAction.COMMENTED]: 'added a comment',
};

export function TaskHistory({ taskId }: TaskHistoryProps) {
  const { data: history, isLoading } = useTaskHistory(taskId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Activity
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
          Activity
        </h3>
        <div className="text-center py-8 text-muted-foreground text-sm">No activity yet</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <History className="h-4 w-4" />
        Activity ({history.length})
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

        <div className="space-y-4">
          {history.map((item) => {
            const Icon = actionIcons[item.action] || Edit;
            const label = actionLabels[item.action] || 'made changes';

            return (
              <div key={item.id} className="relative flex gap-4 pl-1">
                <div className="relative z-10 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="flex-1 pt-1">
                  <p className="text-sm">
                    <span className="font-medium">User</span>{' '}
                    <span className="text-muted-foreground">{label}</span>
                  </p>

                  {item.changes && Object.keys(item.changes).length > 0 && (
                    <Card className="mt-2 p-3 text-xs">
                      {Object.entries(item.changes).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2">
                          <span className="font-medium capitalize">{key}:</span>
                          <span className="text-muted-foreground">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
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
