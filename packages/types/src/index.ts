// User types
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<User, 'password'>;
}

// Task types
export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  createdBy: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDate?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  dueDate?: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user?: User;
  createdAt: Date;
}

export interface CreateCommentDto {
  content: string;
  taskId: string;
}

// Task history types
export enum TaskAction {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  COMMENTED = 'COMMENTED',
}

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  user?: User;
  action: TaskAction;
  changes: Record<string, any>;
  createdAt: Date;
}

// Notification types
export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_COMMENTED = 'TASK_COMMENTED',
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  taskId?: string;
  task?: Task;
  read: boolean;
  createdAt: Date;
}

// WebSocket events
export interface WebSocketEvent<T = any> {
  event: string;
  data: T;
}

export interface NotificationEvent extends WebSocketEvent<Notification> {
  event: 'notification';
}

// RabbitMQ events
export interface TaskCreatedEvent {
  taskId: string;
  title: string;
  assignedToId?: string;
  createdById: string;
}

export interface TaskUpdatedEvent {
  taskId: string;
  title: string;
  changes: Record<string, any>;
  updatedById: string;
  assignedToId?: string;
  createdById: string;
}

export interface TaskAssignedEvent {
  taskId: string;
  title: string;
  assignedToId: string;
  assignedById: string;
}

export interface TaskCommentedEvent {
  taskId: string;
  title: string;
  commentId: string;
  userId: string;
  assignedToId?: string;
  createdById: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
