import { useMemo } from 'react';
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

const WEEKS_TO_SHOW = 12;

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

export function ActivityHeatmap({ tasks }: ActivityHeatmapProps) {
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

    // Go back WEEKS_TO_SHOW weeks
    const startDate = new Date(startOfWeek);
    startDate.setDate(startDate.getDate() - (WEEKS_TO_SHOW - 1) * 7);

    const weeks: DayActivity[][] = [];
    let total = 0;

    const currentDate = new Date(startDate);

    for (let week = 0; week < WEEKS_TO_SHOW; week++) {
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
  }, [tasks]);

  return (
    <div className="activity-heatmap">
      <div className="activity-heatmap-header">
        <div className="activity-heatmap-title">
          <Flame className="h-4 w-4 text-orange-500" />
          Atividade
        </div>
        <div className="activity-heatmap-count">
          {totalCompleted} tarefa{totalCompleted !== 1 ? 's' : ''} concluída
          {totalCompleted !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="activity-heatmap-grid">
        {activityData.map((week, weekIndex) => (
          <div key={weekIndex} className="activity-heatmap-week">
            {week.map((day, dayIndex) => (
              <div
                key={dayIndex}
                className={`activity-heatmap-day ${day.level > 0 ? `level-${day.level}` : ''}`}
                title={`${formatDate(day.date)}: ${day.count} tarefa${day.count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="activity-heatmap-legend">
        <span>Menos</span>
        <div className="activity-heatmap-day" />
        <div className="activity-heatmap-day level-1" />
        <div className="activity-heatmap-day level-2" />
        <div className="activity-heatmap-day level-3" />
        <div className="activity-heatmap-day level-4" />
        <span>Mais</span>
      </div>
    </div>
  );
}
