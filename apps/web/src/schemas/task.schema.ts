import { z } from 'zod';
import { TaskStatus, TaskPriority } from '@repo/types';

// Form input schemas - user enters
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo'),
  description: z.string().min(1, 'Descrição é obrigatória'),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(255, 'Título muito longo').optional(),
  description: z.string().min(1, 'Descrição é obrigatória').optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assignedToId: z.string().uuid().optional().or(z.literal('')),
  dueDate: z.string().optional().or(z.literal('')),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comentário não pode estar vazio'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
