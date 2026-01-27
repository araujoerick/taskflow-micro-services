import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '@repo/types';
import type { UserBasicInfo } from '@/api/services/auth.service';
import { SortableKanbanCard } from './SortableKanbanCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: 'amber' | 'purple' | 'green';
  usersMap: Map<string, UserBasicInfo>;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const columnColors = {
  amber: {
    header: 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-500/30',
    dot: 'bg-amber-500',
    ring: 'ring-amber-200',
  },
  purple: {
    header: 'bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-500/30',
    dot: 'bg-purple-500',
    ring: 'ring-purple-200',
  },
  green: {
    header: 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400',
    border: 'border-green-200 dark:border-green-500/30',
    dot: 'bg-green-500',
    ring: 'ring-green-200',
  },
};

export function KanbanColumn({
  id,
  title,
  tasks,
  color,
  usersMap,
  onEdit,
  onDelete,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  });

  const colors = columnColors[color];
  const taskIds = tasks.map((t) => t.id);

  const getUserName = (userId: string | undefined): string | undefined => {
    if (!userId) return undefined;
    return usersMap.get(userId)?.name;
  };

  return (
    <div
      className={`flex flex-col min-w-[280px] md:min-w-0 md:flex-1 rounded-2xl border ${colors.border} bg-gray-50/50 dark:bg-gray-900/20 transition-colors ${
        isOver ? `ring-2 ${colors.ring} dark:ring-offset-gray-900` : ''
      }`}
    >
      {/* Header */}
      <div className={`px-4 py-3 rounded-t-2xl ${colors.header}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
          <span className="font-semibold text-sm">{title}</span>
          <span className="ml-auto text-xs font-medium opacity-70">{tasks.length}</span>
        </div>
      </div>

      {/* Tasks Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-3 space-y-2 min-h-[200px] overflow-y-auto max-h-[calc(100vh-300px)]"
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableKanbanCard
              key={task.id}
              task={task}
              assigneeName={getUserName(task.assignedTo)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground">
            Arraste tarefas aqui
          </div>
        )}
      </div>
    </div>
  );
}
