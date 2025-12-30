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
    <div className="digital-clock-widget">
      <div className="digital-clock-icon">
        <Clock className="h-5 w-5" />
      </div>
      <div>
        <div className="flex items-baseline">
          <span className="digital-clock-time">{formatTime}</span>
          <span className="digital-clock-period">{isPM ? 'PM' : 'AM'}</span>
        </div>
        <div className="digital-clock-date">{capitalizedDate}</div>
      </div>
    </div>
  );
}
