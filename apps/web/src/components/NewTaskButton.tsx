import { Plus } from 'lucide-react';

interface NewTaskButtonProps {
  onNewTask: () => void;
  variant?: 'default' | 'circular';
}

function OrganicButtonClipPath() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ position: 'absolute', width: 0, height: 0 }}
      aria-hidden="true"
    >
      <defs>
        <clipPath id="organic-button-clip" clipPathUnits="objectBoundingBox">
          <path d="M0.2,0H0.5A0.1,0.1,0,0,1,0.6,0.1V0.2A0.2,0.2,0,0,0,0.8,0.4H0.9A0.1,0.1,0,0,1,1,0.5V0.8A0.2,0.2,0,0,1,0.8,1H0.2A0.2,0.2,0,0,1,0,0.8V0.2A0.2,0.2,0,0,1,0.2,0Z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function NewTaskButton({ onNewTask, variant = 'default' }: NewTaskButtonProps) {
  if (variant === 'circular') {
    return (
      <button
        onClick={onNewTask}
        className="absolute left-1/2 -translate-x-1/2 -top-6 w-13 h-13 rounded-full bg-(--organic-blue) text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all active:scale-105 z-50"
        aria-label="Nova Tarefa"
      >
        <Plus className="h-6 w-6" strokeWidth={2.5} />
      </button>
    );
  }

  return (
    <>
      <OrganicButtonClipPath />
      <button
        onClick={onNewTask}
        className="relative aspect-square overflow-visible w-full h-full transition-all duration-200 ease-out hover:-translate-y-0.5 hover:drop-shadow-[0_5px_10px_rgba(59,130,246,0.5)] cursor-pointer"
        style={{ containerType: 'inline-size' }}
      >
        {/* Background with clip-path */}
        <div
          className="absolute inset-0  bg-(--organic-blue)"
          style={{ clipPath: 'url(#organic-button-clip)' }}
        />

        {/* Floating icon */}
        <div className="absolute top-0 right-0 w-[33%] h-[33%] rounded-full bg-white flex items-center justify-center shadow-[0_4px_15px_rgba(0,0,0,0.08)] z-2">
          <Plus className="w-[60%] h-[60%] text-(--organic-blue)" strokeWidth={2.5} />
        </div>

        {/* Content */}
        <div className="relative z-1 h-full flex justify-center items-center pt-7 px-4 text-white">
          <span className="text-xs font-semibold tracking-wide">Nova Tarefa</span>
        </div>
      </button>
    </>
  );
}
