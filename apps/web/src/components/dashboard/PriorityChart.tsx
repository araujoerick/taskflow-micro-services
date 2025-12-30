import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import { TaskPriority } from '@repo/types';

interface PriorityChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const COLORS = {
  [TaskPriority.LOW]: '#22c55e',
  [TaskPriority.MEDIUM]: '#f59e0b',
  [TaskPriority.HIGH]: '#ef4444',
};

const LABELS = {
  [TaskPriority.LOW]: 'Baixa',
  [TaskPriority.MEDIUM]: 'Média',
  [TaskPriority.HIGH]: 'Alta',
};

export function PriorityChart({ tasks, isLoading }: PriorityChartProps) {
  const data = [
    {
      name: LABELS[TaskPriority.LOW],
      value: tasks.filter((t) => t.priority === TaskPriority.LOW).length,
      priority: TaskPriority.LOW,
    },
    {
      name: LABELS[TaskPriority.MEDIUM],
      value: tasks.filter((t) => t.priority === TaskPriority.MEDIUM).length,
      priority: TaskPriority.MEDIUM,
    },
    {
      name: LABELS[TaskPriority.HIGH],
      value: tasks.filter((t) => t.priority === TaskPriority.HIGH).length,
      priority: TaskPriority.HIGH,
    },
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border h-full">
        <div className="text-base font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Tarefas por Prioridade
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border h-full">
        <div className="text-base font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Tarefas por Prioridade
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma tarefa para exibir</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-card rounded-3xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-black/4 dark:border-border h-full">
      <div className="text-base font-semibold mb-4 flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-blue-500" />
        Tarefas por Prioridade
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={60} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                color: 'var(--popover-foreground)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
              itemStyle={{
                color: 'var(--popover-foreground)',
              }}
              formatter={(value, _name, props) => [`${props.payload.name}: ${value}`, null]}
              labelFormatter={() => ''}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.priority]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
