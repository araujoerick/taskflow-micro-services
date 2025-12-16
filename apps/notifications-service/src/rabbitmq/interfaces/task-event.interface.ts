import { TaskEvent } from '../rabbitmq.service';

/**
 * Enums from tasks-service for type safety
 * These should match the enums in apps/tasks-service/src/tasks/entities/task.entity.ts
 */
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Base interface for all task event data
 */
interface BaseTaskData {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdById: string;
  assignedToId?: string;
}

/**
 * Payload for TASK_CREATED event
 */
export interface TaskCreatedData extends BaseTaskData {
  description?: string;
}

/**
 * Payload for TASK_UPDATED event
 */
export interface TaskUpdatedData extends BaseTaskData {
  description?: string;
  changes: Record<string, { old: unknown; new: unknown }>;
}

/**
 * Payload for TASK_ASSIGNED event
 */
export interface TaskAssignedData {
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  createdById: string;
}

/**
 * Payload for TASK_COMMENTED event
 */
export interface TaskCommentedData {
  title: string;
  createdById: string;
  assignedToId?: string;
  commentId: string;
  commentText?: string;
}

/**
 * Payload for TASK_DELETED event
 */
export interface TaskDeletedData {
  title: string;
  createdById: string;
  assignedToId?: string;
}

/**
 * Union type for all possible task event data
 */
export type TaskEventData =
  | TaskCreatedData
  | TaskUpdatedData
  | TaskAssignedData
  | TaskCommentedData
  | TaskDeletedData;

/**
 * Generic task event payload interface
 */
export interface TaskEventPayload<T extends TaskEventData = TaskEventData> {
  event: TaskEvent;
  taskId: string;
  userId: string;
  data: T;
  timestamp: Date;
}
