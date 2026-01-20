import { useMemo, useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';
import type { Task } from '@repo/types';
import { TaskStatus } from '@repo/types';

interface ActivityHeatmapProps {
  tasks: Task[];
}

interface DayActivity {
  date: Date;
  count: number;
  level: number;
}

const CELL_SIZE = 12; // w-3 = 12px
const GAP_SIZE = 3; // gap-[3px]

function getActivityLevel(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

const levelStyles = {
  0: 'bg-secondary dark:bg-muted',
  1: 'bg-[#c6e48b] dark:bg-purple-500/25',
  2: 'bg-[#7bc96f] dark:bg-purple-500/50',
  3: 'bg-[#239a3b] dark:bg-purple-500/75',
  4: 'bg-[#196127] dark:bg-purple-500',
} as const;

export function ActivityHeatmap({ tasks }: ActivityHeatmapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [weeksToShow, setWeeksToShow] = useState(19);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateWeeks = () => {
      const containerWidth = container.offsetWidth;
      const weekWidth = CELL_SIZE + GAP_SIZE;
      const availableWeeks = Math.floor(containerWidth / weekWidth);
      setWeeksToShow(Math.max(4, availableWeeks));
    };

    calculateWeeks();

    const resizeObserver = new ResizeObserver(calculateWeeks);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  const { activityData, totalCompleted } = useMemo(() => {
    const completedByDate = new Map<string, number>();

    tasks.forEach((task) => {
      if (task.status === TaskStatus.DONE && task.updatedAt) {
        const date = new Date(task.updatedAt);
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        completedByDate.set(dateKey, (completedByDate.get(dateKey) || 0) + 1);
      }
    });

    // Generate last N weeks of data
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find the most recent Sunday (start of week)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    // Go back weeksToShow weeks
    const startDate = new Date(startOfWeek);
    startDate.setDate(startDate.getDate() - (weeksToShow - 1) * 7);

    const weeks: DayActivity[][] = [];
    let total = 0;

    const currentDate = new Date(startDate);

    for (let week = 0; week < weeksToShow; week++) {
      const weekDays: DayActivity[] = [];

      for (let day = 0; day < 7; day++) {
        const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
        const count = completedByDate.get(dateKey) || 0;
        total += count;

        weekDays.push({
          date: new Date(currentDate),
          count,
          level: getActivityLevel(count),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(weekDays);
    }

    return { activityData: weeks, totalCompleted: total };
  }, [tasks, weeksToShow]);

  return (
    <div className="bg-white dark:bg-card rounded-[1.25rem] p-4 max-md:py-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border max-md:order-1">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          Atividade
        </div>
        <div className="text-xs text-muted-foreground">
          {totalCompleted} tarefa{totalCompleted !== 1 ? 's' : ''} concluída
          {totalCompleted !== 1 ? 's' : ''}
        </div>
      </div>

      <div ref={containerRef} className="flex gap-[3px] pb-2 justify-center">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`w-3 h-3 rounded-[3px] transition-all duration-150 hover:scale-125 ${levelStyles[day.level as keyof typeof levelStyles]}`}
                title={`${formatDate(day.date)}: ${day.count} tarefa${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-1 mt-2 text-[0.65rem] text-muted-foreground">
        <span className="mx-1">Menos</span>
        <div className={`w-3 h-3 rounded-[3px] ${levelStyles[0]}`} />
        <div className={`w-3 h-3 rounded-[3px] ${levelStyles[1]}`} />
        <div className={`w-3 h-3 rounded-[3px] ${levelStyles[2]}`} />
        <div className={`w-3 h-3 rounded-[3px] ${levelStyles[3]}`} />
        <div className={`w-3 h-3 rounded-[3px] ${levelStyles[4]}`} />
        <span className="mx-1">Mais</span>
      </div>
    </div>
  );
}
