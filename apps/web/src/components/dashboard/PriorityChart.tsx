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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import { TaskPriority } from '@repo/types';

interface PriorityChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const COLORS = {
  [TaskPriority.LOW]: '#22c55e', // green-500
  [TaskPriority.MEDIUM]: '#eab308', // yellow-500
  [TaskPriority.HIGH]: '#ef4444', // red-500
};

const LABELS = {
  [TaskPriority.LOW]: 'Low',
  [TaskPriority.MEDIUM]: 'Medium',
  [TaskPriority.HIGH]: 'High',
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
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No tasks to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks by Priority</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis type="category" dataKey="name" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--popover)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--popover-foreground)',
                }}
                itemStyle={{
                  color: 'var(--popover-foreground)',
                }}
                formatter={(value, _name, props) => [`${props.payload.name} ${value}`, null]}
                labelFormatter={() => ''}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.priority]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
