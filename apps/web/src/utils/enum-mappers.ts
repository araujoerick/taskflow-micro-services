import { TaskStatus, TaskPriority, NotificationType } from '@repo/types';

export const taskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'Pendente',
  [TaskStatus.IN_PROGRESS]: 'Em Progresso',
  [TaskStatus.DONE]: 'Concluído',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Baixa',
  [TaskPriority.MEDIUM]: 'Média',
  [TaskPriority.HIGH]: 'Alta',
};

// Badge variant mapping for shadcn/ui
export const taskStatusVariants = {
  [TaskStatus.TODO]: 'secondary',
  [TaskStatus.IN_PROGRESS]: 'default',
  [TaskStatus.DONE]: 'success',
} as const;

export const taskPriorityVariants = {
  [TaskPriority.LOW]: 'secondary',
  [TaskPriority.MEDIUM]: 'warning',
  [TaskPriority.HIGH]: 'destructive',
} as const;

export const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.TASK_CREATED]: 'Tarefa Criada',
  [NotificationType.TASK_UPDATED]: 'Tarefa Atualizada',
  [NotificationType.TASK_ASSIGNED]: 'Tarefa Atribuída',
  [NotificationType.TASK_COMMENTED]: 'Comentário Adicionado',
};
