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
    <div className="mini-calendar">
      <div className="mini-calendar-header">
        <button
          onClick={goToToday}
          className="mini-calendar-title hover:text-blue-500 transition-colors cursor-pointer"
        >
          {MONTHS[month]} {year}
        </button>
        <div className="mini-calendar-nav">
          <button onClick={goToPrevMonth} aria-label="Mês anterior">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goToNextMonth} aria-label="Próximo mês">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mini-calendar-weekdays">
        {WEEKDAYS.map((day) => (
          <div key={day} className="mini-calendar-weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="mini-calendar-days">
        {calendarDays.map((dayInfo, index) => (
          <div
            key={index}
            className={`mini-calendar-day ${dayInfo.isOtherMonth ? 'other-month' : ''} ${dayInfo.isToday ? 'today' : ''} ${dayInfo.hasTasks ? 'has-tasks' : ''}`}
          >
            {dayInfo.day}
          </div>
        ))}
      </div>
    </div>
  );
}
