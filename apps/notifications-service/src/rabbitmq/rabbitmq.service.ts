export enum TaskEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMMENTED = 'task.commented',
}

// Re-export types from interfaces
export type {
  TaskEventPayload,
  TaskCreatedData,
  TaskUpdatedData,
  TaskAssignedData,
  TaskCommentedData,
} from './interfaces/task-event.interface';
