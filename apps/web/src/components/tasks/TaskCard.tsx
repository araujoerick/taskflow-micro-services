import { Link } from '@tanstack/react-router';
import { MoreHorizontal, Pencil, Trash2, Calendar, User } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Task } from '@repo/types';
import {
  taskStatusLabels,
  taskPriorityLabels,
  taskStatusVariants,
  taskPriorityVariants,
} from '@/utils/enum-mappers';
import { formatDate } from '@/utils/date-formatters';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function TaskCard({ task, onEdit, onDelete }: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link to="/tasks/$taskId" params={{ taskId: task.id }} className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate hover:text-primary transition-colors">
              {task.title}
            </h3>
          </Link>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-lg py-1 min-w-32">
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2"
                    onClick={() => {
                      onEdit(task);
                      setMenuOpen(false);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </button>
                  <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-accent flex items-center gap-2 text-destructive"
                    onClick={() => {
                      onDelete(task);
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge
            variant={
              taskStatusVariants[task.status] as 'default' | 'secondary' | 'destructive' | 'outline'
            }
          >
            {taskStatusLabels[task.status]}
          </Badge>
          <Badge
            variant={
              taskPriorityVariants[task.priority] as
                | 'default'
                | 'secondary'
                | 'destructive'
                | 'outline'
            }
          >
            {taskPriorityLabels[task.priority]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {task.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
              <Calendar className="h-3 w-3" />
              <span>{formatDate(task.dueDate)}</span>
            </div>
          )}
          {task.assignedTo && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>Assigned</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
