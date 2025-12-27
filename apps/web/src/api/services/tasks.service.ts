import { apiClient } from '../client';
import type {
  Task,
  CreateTaskDto,
  UpdateTaskDto,
  TaskFilters,
  PaginatedResponse,
  Comment,
  TaskHistory,
} from '@repo/types';

export const tasksService = {
  async getTasks(filters: TaskFilters): Promise<PaginatedResponse<Task>> {
    const { data } = await apiClient.get<PaginatedResponse<Task>>('/tasks', {
      params: filters,
    });
    return data;
  },

  async getTaskById(id: string): Promise<Task> {
    const { data } = await apiClient.get<Task>(`/tasks/${id}`);
    return data;
  },

  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const { data } = await apiClient.post<Task>('/tasks', taskData);
    return data;
  },

  async updateTask(id: string, updates: UpdateTaskDto): Promise<Task> {
    const { data } = await apiClient.patch<Task>(`/tasks/${id}`, updates);
    return data;
  },

  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async getComments(taskId: string): Promise<Comment[]> {
    const { data } = await apiClient.get<Comment[]>(`/tasks/${taskId}/comments`);
    return data;
  },

  async addComment(taskId: string, content: string): Promise<Comment> {
    const { data } = await apiClient.post<Comment>(`/tasks/${taskId}/comments`, {
      content,
      taskId,
    });
    return data;
  },

  async getHistory(taskId: string): Promise<TaskHistory[]> {
    const { data } = await apiClient.get<TaskHistory[]>(`/tasks/${taskId}/history`);
    return data;
  },
};
