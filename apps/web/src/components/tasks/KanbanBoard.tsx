import { useState, useMemo, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useQuery } from '@tanstack/react-query';
import { TaskStatus } from '@repo/types';
import type { Task, TaskStatus as TaskStatusType } from '@repo/types';
import { authService, type UserBasicInfo } from '@/api/services/auth.service';
import { taskStatusLabels } from '@/utils/enum-mappers';
import { KanbanColumn } from './KanbanColumn';
import { KanbanTaskCard } from './KanbanTaskCard';

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (task: Task, status: TaskStatusType) => void;
}

// Optimistic status overrides (taskId -> new status)
type OptimisticUpdates = Map<string, TaskStatusType>;

const columns: { id: TaskStatus; title: string; color: 'amber' | 'purple' | 'green' }[] = [
  { id: TaskStatus.TODO, title: taskStatusLabels[TaskStatus.TODO], color: 'amber' },
  { id: TaskStatus.IN_PROGRESS, title: taskStatusLabels[TaskStatus.IN_PROGRESS], color: 'purple' },
  { id: TaskStatus.DONE, title: taskStatusLabels[TaskStatus.DONE], color: 'green' },
];

export function KanbanBoard({ tasks, onStatusChange }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<OptimisticUpdates>(new Map());

  // Sync optimistic updates when tasks change (after API response)
  useEffect(() => {
    // Clear optimistic updates for tasks that have been updated
    setOptimisticUpdates((prev) => {
      const next = new Map(prev);
      for (const [taskId, optimisticStatus] of prev) {
        const task = tasks.find((t) => t.id === taskId);
        // If the task's actual status matches the optimistic status, remove the override
        if (task && task.status === optimisticStatus) {
          next.delete(taskId);
        }
      }
      return next.size !== prev.size ? next : prev;
    });
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get unique user IDs from tasks
  const userIds = useMemo(() => {
    const ids = new Set<string>();
    tasks.forEach((t) => {
      ids.add(t.createdBy);
      if (t.assignedTo) {
        ids.add(t.assignedTo);
      }
    });
    return [...ids];
  }, [tasks]);

  const { data: users } = useQuery({
    queryKey: ['users', userIds],
    queryFn: () => authService.getUsersByIds(userIds),
    enabled: userIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const usersMap = useMemo(() => {
    const map = new Map<string, UserBasicInfo>();
    users?.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  // Group tasks by status (with optimistic updates applied)
  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };

    tasks.forEach((task) => {
      // Use optimistic status if available, otherwise use actual status
      const effectiveStatus = optimisticUpdates.get(task.id) || task.status;
      grouped[effectiveStatus].push(task);
    });

    return grouped;
  }, [tasks, optimisticUpdates]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const task = tasks.find((t) => t.id === activeTaskId);
    if (!task) return;

    // Determine the target status
    let targetStatus: TaskStatusType | null = null;

    // Check if dropped over a column
    if (over.data.current?.type === 'column') {
      targetStatus = over.data.current.status;
    }
    // Check if dropped over a task (get its column)
    else if (over.data.current?.type === 'task') {
      const overTask = over.data.current.task as Task;
      targetStatus = overTask.status;
    }
    // Check if over.id is a status (column id)
    else if (Object.values(TaskStatus).includes(over.id as TaskStatus)) {
      targetStatus = over.id as TaskStatusType;
    }

    // Check effective status (considering optimistic updates)
    const effectiveStatus = optimisticUpdates.get(task.id) || task.status;

    if (targetStatus && targetStatus !== effectiveStatus) {
      // Apply optimistic update immediately
      setOptimisticUpdates((prev) => new Map(prev).set(task.id, targetStatus));
      // Call API in background
      onStatusChange(task, targetStatus);
    }
  };

  const getUserName = (userId: string | undefined): string | undefined => {
    if (!userId) return undefined;
    return usersMap.get(userId)?.name;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id]}
            usersMap={usersMap}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div className="rotate-3 scale-105">
            <KanbanTaskCard
              task={activeTask}
              assigneeName={getUserName(activeTask.assignedTo)}
              isDragging
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
