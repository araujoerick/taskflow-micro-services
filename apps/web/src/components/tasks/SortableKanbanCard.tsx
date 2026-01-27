import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '@repo/types';
import { KanbanTaskCard } from './KanbanTaskCard';

interface SortableKanbanCardProps {
  task: Task;
  assigneeName?: string;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

export function SortableKanbanCard({
  task,
  assigneeName,
  onEdit,
  onDelete,
}: SortableKanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <KanbanTaskCard
        task={task}
        assigneeName={assigneeName}
        isDragging={isDragging}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
