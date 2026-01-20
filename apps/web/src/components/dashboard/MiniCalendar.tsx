import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from '@repo/types';

interface MiniCalendarProps {
  tasks: Task[];
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function MiniCalendar({ tasks }: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

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

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const today = new Date();
  const isToday = (day: number, monthOffset: number = 0) => {
    const checkMonth = month + monthOffset;
    return (
      today.getDate() === day && today.getMonth() === checkMonth && today.getFullYear() === year
    );
  };

  const hasTasksOnDay = (day: number, monthOffset: number = 0) => {
    const checkYear =
      monthOffset === -1 && month === 0
        ? year - 1
        : monthOffset === 1 && month === 11
          ? year + 1
          : year;
    const checkMonth =
      monthOffset === -1 && month === 0
        ? 11
        : monthOffset === 1 && month === 11
          ? 0
          : month + monthOffset;
    return datesWithTasks.has(`${checkYear}-${checkMonth}-${day}`);
  };

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar days
  const calendarDays = [];

  // Previous month days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    calendarDays.push({
      day,
      isOtherMonth: true,
      isToday: isToday(day, -1),
      hasTasks: hasTasksOnDay(day, -1),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push({
      day,
      isOtherMonth: false,
      isToday: isToday(day),
      hasTasks: hasTasksOnDay(day),
    });
  }

  // Next month days to fill the grid (6 rows * 7 days = 42)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    calendarDays.push({
      day,
      isOtherMonth: true,
      isToday: isToday(day, 1),
      hasTasks: hasTasksOnDay(day, 1),
    });
  }

  return (
    <div className="bg-white dark:bg-card rounded-[1.25rem] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToToday}
          className="font-semibold text-sm hover:text-blue-500 transition-colors cursor-pointer"
        >
          {MONTHS[month]} {year}
        </button>
        <div className="flex gap-1">
          <button
            onClick={goToPrevMonth}
            aria-label="Mês anterior"
            className="w-7 h-7 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToNextMonth}
            aria-label="Próximo mês"
            className="w-7 h-7 rounded-full border-none bg-transparent cursor-pointer flex items-center justify-center transition-all duration-150 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-[0.65rem] font-medium text-muted-foreground py-1 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`aspect-square flex items-center justify-center text-xs rounded-full cursor-pointer transition-all duration-150 relative hover:bg-secondary
              ${dayInfo.isOtherMonth ? 'text-muted-foreground opacity-40' : ''}
              ${dayInfo.isToday ? 'bg-blue-500 text-white font-semibold hover:bg-blue-500' : ''}
            `}
          >
            {dayInfo.day}
            {dayInfo.hasTasks && (
              <span
                className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dayInfo.isToday ? 'bg-white' : 'bg-purple-500'}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
