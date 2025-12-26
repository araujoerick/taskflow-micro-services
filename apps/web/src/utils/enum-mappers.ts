import { TaskStatus, TaskPriority, NotificationType } from '@repo/types';

export const taskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'Pending',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Completed',
};

export const taskPriorityLabels: Record<TaskPriority, string> = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
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
  [NotificationType.TASK_CREATED]: 'Task Created',
  [NotificationType.TASK_UPDATED]: 'Task Updated',
  [NotificationType.TASK_ASSIGNED]: 'Task Assigned',
  [NotificationType.TASK_COMMENTED]: 'Comment Added',
};
