/**
 * Metadata for TASK_CREATED notification
 */
export interface TaskCreatedMetadata {
  taskTitle: string;
  taskStatus: string;
  taskPriority: string;
  createdBy?: string;
}

/**
 * Metadata for TASK_UPDATED notification
 */
export interface TaskUpdatedMetadata {
  taskTitle: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  updatedBy: string;
}

/**
 * Metadata for TASK_ASSIGNED notification
 */
export interface TaskAssignedMetadata {
  taskTitle: string;
  taskStatus: string;
  taskPriority: string;
  assignedBy: string;
}

/**
 * Metadata for TASK_COMMENTED notification
 */
export interface TaskCommentedMetadata {
  taskTitle: string;
  commentId: string;
  commentedBy: string;
}

/**
 * Metadata for TASK_DELETED notification
 */
export interface TaskDeletedMetadata {
  taskTitle: string;
  taskDeleted: boolean;
}

/**
 * Union type for all possible notification metadata
 */
export type NotificationMetadata =
  | TaskCreatedMetadata
  | TaskUpdatedMetadata
  | TaskAssignedMetadata
  | TaskCommentedMetadata
  | TaskDeletedMetadata;
