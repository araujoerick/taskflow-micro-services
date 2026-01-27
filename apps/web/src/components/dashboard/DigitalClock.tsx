import { useState, useEffect } from 'react';

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

  const formatWeekday = time.toLocaleDateString('pt-BR', {
    weekday: 'long',
  });
  const formatDate = time.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  });

  // Capitalize first letter
  const capitalizedWeekday = formatWeekday.charAt(0).toUpperCase() + formatWeekday.slice(1);

  return (
    <div className="bg-white hidden sm:flex dark:bg-card rounded-[1.25rem] p-5 max-md:py-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border  items-center gap-3 max-md:order-1">
      <div className="text-[1.5rem] font-light tracking-tight tabular-nums leading-none mt-0.5">
        {formatTime}
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{capitalizedWeekday}</div>
        <div className="text-xs text-muted-foreground">{formatDate}</div>
      </div>
    </div>
  );
}
