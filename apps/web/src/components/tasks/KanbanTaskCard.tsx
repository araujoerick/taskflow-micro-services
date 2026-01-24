import { Link } from '@tanstack/react-router';
import type { Task } from '@repo/types';
import { TaskPriority } from '@repo/types';
import { taskPriorityLabels } from '@/utils/enum-mappers';

interface KanbanTaskCardProps {
  task: Task;
  assigneeName?: string;
  isDragging?: boolean;
}

const badgeBase = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium';

const priorityBadgeStyles = {
  [TaskPriority.LOW]: `${badgeBase} bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400`,
  [TaskPriority.MEDIUM]: `${badgeBase} bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400`,
  [TaskPriority.HIGH]: `${badgeBase} bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400`,
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function KanbanTaskCard({ task, assigneeName, isDragging }: KanbanTaskCardProps) {
  return (
    <div
      className={`bg-white dark:bg-card rounded-xl p-3 shadow-sm border border-black/5 dark:border-border transition-all duration-200 ${
        isDragging
          ? 'opacity-50 shadow-lg scale-105 rotate-2'
          : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Title */}
      <Link
        to="/tasks/$taskId"
        params={{ taskId: task.id }}
        className="block text-sm font-medium truncate hover:text-purple-600 transition-colors mb-2"
      >
        {task.title}
      </Link>

      {/* Footer: Priority + Avatar */}
      <div className="flex items-center justify-between">
        <span className={priorityBadgeStyles[task.priority]}>
          {taskPriorityLabels[task.priority]}
        </span>

        {assigneeName && (
          <div
            className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-[10px] font-medium text-purple-700 dark:text-purple-300"
            title={assigneeName}
          >
            {getInitials(assigneeName)}
          </div>
        )}
      </div>
    </div>
  );
}
