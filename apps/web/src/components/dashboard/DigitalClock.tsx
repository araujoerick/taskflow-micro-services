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

  const formatTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const formatDate = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  // Capitalize first letter
  const capitalizedDate = formatDate.charAt(0).toUpperCase() + formatDate.slice(1);

  return (
    <div className="bg-white hidden sm:flex dark:bg-card rounded-[1.25rem] p-5 max-md:py-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border  items-center gap-3 max-md:order-1">
      <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white shrink-0">
        <Clock className="h-4 w-4" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{capitalizedDate}</div>
        <div className="text-[1.5rem] font-light tracking-tight tabular-nums leading-none mt-0.5">
          {formatTime}
        </div>
      </div>
    </div>
  );
}
