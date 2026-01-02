import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NewTaskButtonProps {
  onNewTask: () => void;
  variant?: 'default' | 'circular';
}

export function NewTaskButton({ onNewTask, variant = 'default' }: NewTaskButtonProps) {
  if (variant === 'circular') {
    return (
      <button
        onClick={onNewTask}
        className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
        aria-label="Nova Tarefa"
      >
        <Plus className="h-7 w-7" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <Button
      onClick={onNewTask}
      className={cn(
        'rounded-full! sm:px-6 py-3 font-medium transition-all duration-200',
        'bg-blue-600! text-white! border-none!',
        'hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-5px_rgba(37,99,235,0.5)]',
      )}
    >
      <Plus className="h-4 w-4" />
      <span className="hidden sm:inline-block">Nova Tarefa</span>
    </Button>
  );
}
