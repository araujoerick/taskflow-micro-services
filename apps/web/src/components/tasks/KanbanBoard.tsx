import { useState, useMemo, useOptimistic, useId, startTransition } from 'react';
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
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

type OptimisticAction = { taskId: string; newStatus: TaskStatusType };

const columns: { id: TaskStatus; title: string; color: 'amber' | 'purple' | 'green' }[] = [
  { id: TaskStatus.TODO, title: taskStatusLabels[TaskStatus.TODO], color: 'amber' },
  { id: TaskStatus.IN_PROGRESS, title: taskStatusLabels[TaskStatus.IN_PROGRESS], color: 'purple' },
  { id: TaskStatus.DONE, title: taskStatusLabels[TaskStatus.DONE], color: 'green' },
];

export function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const dndContextId = useId();

  const [optimisticTasks, addOptimisticUpdate] = useOptimistic(
    tasks,
    (currentTasks, { taskId, newStatus }: OptimisticAction) =>
      currentTasks.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task)),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
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

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      [TaskStatus.TODO]: [],
      [TaskStatus.IN_PROGRESS]: [],
      [TaskStatus.DONE]: [],
    };

    optimisticTasks.forEach((task) => {
      grouped[task.status].push(task);
    });

    return grouped;
  }, [optimisticTasks]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = optimisticTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeTaskId = active.id as string;
    const task = optimisticTasks.find((t) => t.id === activeTaskId);
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

    if (targetStatus && targetStatus !== task.status) {
      startTransition(() => {
        addOptimisticUpdate({ taskId: task.id, newStatus: targetStatus });
        onStatusChange(task, targetStatus);
      });
    }
  };

  const getUserName = (userId: string | undefined): string | undefined => {
    if (!userId) return undefined;
    return usersMap.get(userId)?.name;
  };

  return (
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="-mx-2 p-2 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:snap-none scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            tasks={tasksByStatus[column.id]}
            usersMap={usersMap}
            onEdit={onEdit}
            onDelete={onDelete}
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
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
