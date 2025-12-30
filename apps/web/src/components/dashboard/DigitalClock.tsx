import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;

  const formatTime = `${displayHours}:${minutes.toString().padStart(2, '0')}`;

  const formatDate = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Capitalize first letter
  const capitalizedDate = formatDate.charAt(0).toUpperCase() + formatDate.slice(1);

  return (
    <div className="bg-white dark:bg-card rounded-3xl px-6 py-4 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white">
        <Clock className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-baseline">
          <span className="text-[2rem] font-light tracking-tight tabular-nums leading-none">
            {formatTime}
          </span>
          <span className="text-xs font-semibold bg-blue-500 text-white px-2 py-0.5 rounded-md ml-1">
            {isPM ? 'PM' : 'AM'}
          </span>
        </div>
        <div className="text-[0.8rem] text-muted-foreground mt-1">{capitalizedDate}</div>
      </div>
    </div>
  );
}
