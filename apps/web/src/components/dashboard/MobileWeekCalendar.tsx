import { useRef, useEffect, useMemo } from 'react';
import type { Task } from '@repo/types';

interface MobileWeekCalendarProps {
  tasks: Task[];
}

const WEEKDAYS_SHORT = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export function MobileWeekCalendar({ tasks }: MobileWeekCalendarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  // Get dates with tasks (due dates)
  const datesWithTasks = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const date = new Date(task.dueDate);
        dates.add(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      }
    });
    return dates;
  }, [tasks]);

  // Generate 15 days: 7 before, today, 7 after
  const days = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = -7; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const isToday = i === 0;
      const hasTasks = datesWithTasks.has(
        `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
      );

      result.push({
        date,
        day: date.getDate(),
        weekday: WEEKDAYS_SHORT[date.getDay()],
        isToday,
        hasTasks,
      });
    }

    return result;
  }, [datesWithTasks]);

  // Scroll to center (today) on mount
  useEffect(() => {
    if (todayRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const todayElement = todayRef.current;

      const scrollLeft =
        todayElement.offsetLeft - container.offsetWidth / 2 + todayElement.offsetWidth / 2;

      container.scrollTo({
        left: scrollLeft,
        behavior: 'instant',
      });
    }
  }, []);

  const today = new Date();
  const monthName = today.toLocaleDateString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  return (
    <div className="bg-(--organic-blue) text-white pb-4">
      {/* Month title */}
      <div className="px-4 pt-2 pb-3">
        <h2 className="text-lg font-bold">{capitalizedMonth}</h2>
      </div>

      {/* Scrollable days */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-hide gap-1 px-4 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {days.map((dayInfo, index) => (
          <div
            key={index}
            ref={dayInfo.isToday ? todayRef : null}
            className={`flex flex-col items-center justify-center min-w-10 py-2 px-1 rounded-xl snap-center transition-all mx-auto
              ${dayInfo.isToday ? 'bg-white text-blue-500' : 'text-white/90 hover:bg-white/10'}
            `}
          >
            <span className="text-[10px] font-medium uppercase opacity-80">{dayInfo.weekday}</span>
            <span className={`text-base font-bold mt-0.5 ${dayInfo.isToday ? '' : ''}`}>
              {dayInfo.day}
            </span>
            {dayInfo.hasTasks && (
              <span
                className={`w-1 h-1 rounded-full mt-0.5 ${dayInfo.isToday ? 'bg-blue-500' : 'bg-white'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
