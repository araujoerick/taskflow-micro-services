import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Task } from '@repo/types';
import { TaskStatus } from '@repo/types';

interface StatusChartProps {
  tasks: Task[];
  isLoading: boolean;
}

const COLORS = {
  [TaskStatus.TODO]: '#eab308', // yellow-500
  [TaskStatus.IN_PROGRESS]: '#8b5cf6', // purple-500
  [TaskStatus.DONE]: '#22c55e', // green-500
};

const LABELS = {
  [TaskStatus.TODO]: 'Pending',
  [TaskStatus.IN_PROGRESS]: 'In Progress',
  [TaskStatus.DONE]: 'Completed',
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
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Status</CardTitle>
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
          <CardTitle>Tasks by Status</CardTitle>
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
        <CardTitle>Tasks by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
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
              {/* <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              /> */}
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
