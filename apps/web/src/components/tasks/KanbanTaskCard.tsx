import { Link } from '@tanstack/react-router';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '@repo/types';
import { TaskPriority } from '@repo/types';
import { taskPriorityLabels } from '@/utils/enum-mappers';
import { useAuth } from '@/contexts/AuthContext';

interface KanbanTaskCardProps {
  task: Task;
  assigneeName?: string;
  isDragging?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
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

export function KanbanTaskCard({
  task,
  assigneeName,
  isDragging,
  onEdit,
  onDelete,
}: KanbanTaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const isCreator = user?.id === task.createdBy;

  return (
    <div
      className={`bg-white dark:bg-card rounded-[10px] p-3 shadow-sm border border-black/5 dark:border-border transition-all duration-200 group ${
        isDragging
          ? 'opacity-50 shadow-lg scale-105 rotate-2'
          : 'hover:shadow-md hover:-translate-y-0.5'
      }`}
    >
      {/* Header with Title and Menu */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          to="/tasks/$taskId"
          params={{ taskId: task.id }}
          className="flex-1 min-w-0 text-sm font-medium truncate hover:text-purple-600 transition-colors"
        >
          {task.title}
        </Link>

        {isCreator && (
          <div className="relative">
            <button
              className="w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal className="h-3.5 w-3.5 text-gray-500" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-card border rounded-sm! shadow-lg py-1 min-w-32 overflow-hidden">
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 flex items-center gap-2 transition-colors"
                    onClick={() => {
                      onEdit(task);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-4 w-4 text-purple-500" />
                    Editar
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 text-red-600 transition-colors"
                    onClick={() => {
                      onDelete(task);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

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
