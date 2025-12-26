import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@repo/types';

// Form input schemas - user enters
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().default(''),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long').optional(),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
