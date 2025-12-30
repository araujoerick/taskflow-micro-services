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

const colorStyles = {
  blue: {
    bg: 'bg-blue-500',
    icon: 'text-blue-500',
    hoverShadow: 'hover:drop-shadow-[0_5px_10px_rgba(59,130,246,0.4)]',
  },
  yellow: {
    bg: 'bg-amber-500',
    icon: 'text-amber-500',
    hoverShadow: 'hover:drop-shadow-[0_5px_10px_rgba(245,158,11,0.4)]',
  },
  purple: {
    bg: 'bg-purple-500',
    icon: 'text-purple-500',
    hoverShadow: 'hover:drop-shadow-[0_5px_10px_rgba(168,85,247,0.4)]',
  },
  green: {
    bg: 'bg-green-500',
    icon: 'text-green-500',
    hoverShadow: 'hover:drop-shadow-[0_5px_10px_rgba(34,197,94,0.4)]',
  },
};

function OrganicCardClipPath() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="organic-card-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.1,0H0.77A0.05,0.1,0,0,1,0.82,0.1V0.2A0.1,0.2,0,0,0,0.92,0.4H0.95A0.05,0.1,0,0,1,1,0.5V0.8A0.1,0.2,0,0,1,0.9,1H0.1A0.1,0.2,0,0,1,0,0.8V0.2A0.1,0.2,0,0,1,0.1,0Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

function OrganicStatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={`relative aspect-2/1 overflow-visible transition-transform duration-200 ease-out hover:-translate-y-1 ${styles.hoverShadow}`}
      style={{ containerType: 'inline-size' }}
    >
      {/* Background with clip-path applied */}
      <div
        className={`absolute inset-0 rounded-3xl ${styles.bg}`}
        style={{ clipPath: 'url(#organic-card-clip)' }}
      />

      {/* Floating icon in the bite area */}
      <div className="absolute top-[2cqw] right-0 w-[15cqw] h-[15cqw] rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.08)] z-2">
        <Icon className={`w-[9cqw] h-[9cqw] ${styles.icon}`} />
      </div>

      {/* Content */}
      <div className="relative z-1 p-5 pr-14 text-white h-full flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</h3>
          <p className="text-4xl font-black mt-2 leading-none">{value}</p>
        </div>

        <p className="text-[10px] font-medium mt-4 opacity-90 leading-tight bg-white/20 w-fit px-2 py-1 rounded-full">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="relative aspect-2/1 overflow-visible" style={{ containerType: 'inline-size' }}>
      <div className="absolute inset-0 rounded-3xl bg-muted/50" />
      <div className="absolute top-[2cqw] right-0 w-[15cqw] h-[15cqw] rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.08)] z-2">
        <Skeleton className="h-5 w-5 rounded-full" />
      </div>
      <div className="relative z-1 p-5 pr-14 h-full flex flex-col justify-between">
        <div>
          <Skeleton className="h-3 w-16 bg-muted" />
          <Skeleton className="h-8 w-10 mt-2 bg-muted" />
        </div>
        <Skeleton className="h-4 w-20 bg-muted rounded-full" />
      </div>
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
    <>
      {/* SVG definitions for clip-path - rendered once */}
      <OrganicCardClipPath />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <OrganicStatCard key={card.title} {...card} />
        ))}
      </div>
    </>
  );
}
