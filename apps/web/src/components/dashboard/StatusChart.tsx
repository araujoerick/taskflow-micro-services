import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import { TaskStatus } from '@repo/types';

interface StatusChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const COLORS = {
  [TaskStatus.TODO]: '#f59e0b',
  [TaskStatus.IN_PROGRESS]: '#8b5cf6',
  [TaskStatus.DONE]: '#22c55e',
};

const LABELS = {
  [TaskStatus.TODO]: 'Pendente',
  [TaskStatus.IN_PROGRESS]: 'Em Progresso',
  [TaskStatus.DONE]: 'Concluído',
};

export function StatusChart({ tasks, isLoading }: StatusChartProps) {
  const data = [
    {
      name: LABELS[TaskStatus.TODO],
      value: tasks.filter((t) => t.status === TaskStatus.TODO).length,
      status: TaskStatus.TODO,
    },
    {
      name: LABELS[TaskStatus.IN_PROGRESS],
      value: tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length,
      status: TaskStatus.IN_PROGRESS,
    },
    {
      name: LABELS[TaskStatus.DONE],
      value: tasks.filter((t) => t.status === TaskStatus.DONE).length,
      status: TaskStatus.DONE,
    },
  ].filter((d) => d.value > 0);

  if (isLoading) {
    return (
      <div className="organic-chart-container">
        <div className="organic-chart-title">
          <PieChartIcon className="h-5 w-5 text-purple-500" />
          Tarefas por Status
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="organic-chart-container">
        <div className="organic-chart-title">
          <PieChartIcon className="h-5 w-5 text-purple-500" />
          Tarefas por Status
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">Nenhuma tarefa para exibir</p>
        </div>
      </div>
    );
  }

  return (
    <div className="organic-chart-container">
      <div className="organic-chart-title">
        <PieChartIcon className="h-5 w-5 text-purple-500" />
        Tarefas por Status
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
              legendType="none"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.status]} />
              ))}
            </Pie>
            <Legend
              wrapperStyle={{
                paddingTop: '16px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
