import { Link } from '@tanstack/react-router';
import { MoreHorizontal, Pencil, Trash2, Calendar, User, UserCircle } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Task } from '@repo/types';
import { TaskStatus, TaskPriority } from '@repo/types';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';
import { formatDate } from '@/utils/date-formatters';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onStatusChange?: (task: Task, status: TaskStatus) => void;
  creatorName?: string;
  assigneeName?: string;
}

const badgeBase = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium';

const statusBadgeStyles = {
  [TaskStatus.TODO]: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400`,
  [TaskStatus.IN_PROGRESS]: `${badgeBase} bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400`,
  [TaskStatus.DONE]: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400`,
};

const priorityBadgeStyles = {
  [TaskPriority.LOW]: `${badgeBase} bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400`,
  [TaskPriority.MEDIUM]: `${badgeBase} bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400`,
  [TaskPriority.HIGH]: `${badgeBase} bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400`,
};

export function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  creatorName,
  assigneeName,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user } = useAuth();

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const isCreator = user?.id === task.createdBy;
  const isAssignee = user?.id === task.assignedTo;
  const canChangeStatus = isCreator || isAssignee;

  return (
    <div className="bg-white dark:bg-card rounded-[1.25rem] p-5 shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-black/3 dark:border-border transition-all duration-200 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] hover:-translate-y-1 group">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="flex-1 min-w-0">
          <h3 className="font-semibold text-base truncate hover:text-purple-600 transition-colors">
            {task.title}
          </h3>
        </Link>

        {isCreator && (
          <div className="relative">
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-card border rounded-xl shadow-lg py-1 min-w-32 overflow-hidden">
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

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        {canChangeStatus && onStatusChange ? (
          <Select
            value={task.status}
            onValueChange={(value) => onStatusChange(task, value as TaskStatus)}
          >
            <SelectTrigger className="h-7 w-auto text-xs px-3 rounded-full border-0 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {Object.values(TaskStatus).map((s) => (
                <SelectItem key={s} value={s} className="rounded-lg">
                  {taskStatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className={statusBadgeStyles[task.status]}>{taskStatusLabels[task.status]}</span>
        )}
        <span className={priorityBadgeStyles[task.priority]}>
          {taskPriorityLabels[task.priority]}
        </span>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-3 border-t border-gray-100 dark:border-gray-800">
        {creatorName && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <UserCircle className="h-3 w-3 text-blue-500" />
            </div>
            <span>{creatorName}</span>
          </div>
        )}
        {task.dueDate && (
          <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500' : ''}`}>
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center ${isOverdue ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
            >
              <Calendar className={`h-3 w-3 ${isOverdue ? 'text-red-500' : 'text-gray-500'}`} />
            </div>
            <span>{formatDate(task.dueDate)}</span>
          </div>
        )}
        {assigneeName && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <User className="h-3 w-3 text-green-500" />
            </div>
            <span>{assigneeName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
