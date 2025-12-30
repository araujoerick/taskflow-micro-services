import { ListTodo, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import { TaskStatus } from '@repo/types';

interface StatsCardsProps {
  tasks: Task[];
  isLoading: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'purple' | 'green';
}

function OrganicStatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className={`organic-stat-card ${color}`}>
      {/* Container for inverted curves (creates liquid union effect) */}
      <div className="organic-stat-card-curve" />

      {/* Floating icon circle */}
      <div className="organic-stat-icon">
        <Icon />
      </div>

      {/* Card content */}
      <div className="flex flex-col h-full justify-between relative z-1">
        <div>
          <h3 className="organic-stat-card-title">{title}</h3>
          <p className="organic-stat-card-value">{value}</p>
        </div>

        <p className="organic-stat-card-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="organic-stat-card bg-muted/50">
      <div className="organic-stat-card-curve" />
      <div className="organic-stat-icon">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div>
        <Skeleton className="h-4 w-20 bg-muted" />
        <Skeleton className="h-8 w-12 mt-2 bg-muted" />
      </div>
      <Skeleton className="h-3 w-24 bg-muted" />
    </div>
  );
}

export function StatsCards({ tasks, isLoading }: StatsCardsProps) {
  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === TaskStatus.TODO).length,
    inProgress: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
    done: tasks.filter((t) => t.status === TaskStatus.DONE).length,
  };

  const cards: StatCardProps[] = [
    {
      title: 'Total',
      value: stats.total,
      subtitle: `${stats.total} tarefas registradas`,
      icon: ListTodo,
      color: 'blue',
    },
    {
      title: 'Pendentes',
      value: stats.todo,
      subtitle: `${stats.todo} aguardando início`,
      icon: AlertCircle,
      color: 'yellow',
    },
    {
      title: 'Em Progresso',
      value: stats.inProgress,
      subtitle: `${stats.inProgress} em andamento`,
      icon: Clock,
      color: 'purple',
    },
    {
      title: 'Concluídas',
      value: stats.done,
      subtitle: `${stats.done} finalizadas`,
      icon: CheckCircle2,
      color: 'green',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <OrganicStatCard key={card.title} {...card} />
      ))}
    </div>
  );
}
