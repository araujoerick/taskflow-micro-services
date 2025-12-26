// Re-export all types from @repo/types
export * from '@repo/types';

// Frontend specific UI types
export interface TaskFiltersUI {
  search: string;
  statusFilter: string; // 'all' | TaskStatus
  priorityFilter: string; // 'all' | TaskPriority
  page: number;
}

export interface UIState {
  isLoading: boolean;
  error: string | null;
}
