import { ArrowLeft, Pencil, Trash2, Calendar, User, Clock } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import {
  taskStatusLabels,
  taskPriorityLabels,
  taskStatusVariants,
  taskPriorityVariants,
} from '@/utils/enum-mappers';
import { formatDate, formatDateTime } from '@/utils/date-formatters';
import { useAuth } from '@/contexts/AuthContext';

interface TaskDetailsProps {
  task: Task | undefined;
  isLoading: boolean;
  onEdit: () => void;
  onDelete: () => void;
  assigneeName?: string;
}

export function TaskDetails({ task, isLoading, onEdit, onDelete, assigneeName }: TaskDetailsProps) {
  const { user } = useAuth();
  const isCreator = user?.id === task?.createdBy;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-20" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!task) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <p className="text-muted-foreground">Tarefa não encontrada</p>
          <Link to="/tasks">
            <Button variant="link" className="mt-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar para tarefas
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/tasks">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-xl">{task.title}</CardTitle>
          </div>
          {isCreator && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex flex-wrap gap-2">
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

        {task.description && (
          <div>
            <h4 className="text-sm font-medium mb-2">Descrição</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{task.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {task.dueDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar
                className={`h-4 w-4 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}
              />
              <div>
                <p className="text-muted-foreground text-xs">Data de Vencimento</p>
                <p className={isOverdue ? 'text-destructive font-medium' : ''}>
                  {formatDate(task.dueDate)}
                  {isOverdue && ' (Atrasada)'}
                </p>
              </div>
            </div>
          )}

          {assigneeName && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground text-xs">Atribuído Para</p>
                <p>{assigneeName}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Criado em</p>
              <p>{formatDateTime(task.createdAt)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-muted-foreground text-xs">Atualizado em</p>
              <p>{formatDateTime(task.updatedAt)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
