import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksService } from '@/api/services/tasks.service';
import { queryKeys } from '@/utils/query-keys';
import type { TaskFilters, CreateTaskDto, UpdateTaskDto } from '@repo/types';

export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => tasksService.getTasks(filters),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id),
    queryFn: () => tasksService.getTaskById(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskData: CreateTaskDto) => tasksService.createTask(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskDto }) =>
      tasksService.updateTask(id, updates),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(id) });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tasksService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.comments(taskId),
    queryFn: () => tasksService.getComments(taskId),
    enabled: !!taskId,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) =>
      tasksService.addComment(taskId, content),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskId) });
    },
  });
}

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.history(taskId),
    queryFn: () => tasksService.getHistory(taskId),
    enabled: !!taskId,
  });
}
