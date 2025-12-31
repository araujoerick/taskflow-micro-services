import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  onNewTask: () => void;
}

export function PageHeader({ title, subtitle, onNewTask }: PageHeaderProps) {
  return (
    <div className=" mb-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-[1.75rem] font-bold tracking-tight">{title}</h1>
        <Button
          onClick={onNewTask}
          className="rounded-full! sm:px-6 py-3 font-medium transition-all duration-200 bg-blue-600! text-white! border-none! hover:-translate-y-0.5 hover:shadow-[0_8px_25px_-5px_rgba(37,99,235,0.5)]"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline-block">Nova Tarefa</span>
        </Button>
      </div>
      <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
    </div>
  );
}
