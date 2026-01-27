import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TaskStatus, TaskPriority } from '@repo/types';
import type { Task } from '@repo/types';
import { createTaskSchema, type CreateTaskInput } from '@/schemas/task.schema';
import { taskStatusLabels, taskPriorityLabels } from '@/utils/enum-mappers';
import { authService } from '@/api/services/auth.service';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  isLoading: boolean;
}

interface FormFieldsProps {
  register: ReturnType<typeof useForm<CreateTaskInput>>['register'];
  errors: ReturnType<typeof useForm<CreateTaskInput>>['formState']['errors'];
  status: TaskStatus;
  priority: TaskPriority;
  assignedToId: string;
  setValue: ReturnType<typeof useForm<CreateTaskInput>>['setValue'];
  users: { id: string; name: string }[];
}

function FormFields({
  register,
  errors,
  status,
  priority,
  assignedToId,
  setValue,
  users,
}: FormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Digite o título da tarefa"
          {...register('title')}
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição *</Label>
        <Textarea
          id="description"
          placeholder="Digite a descrição da tarefa"
          rows={3}
          {...register('description')}
          aria-invalid={!!errors.description}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(value) => setValue('status', value as TaskStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {Object.values(TaskStatus).map((s) => (
                <SelectItem key={s} value={s}>
                  {taskStatusLabels[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select
            value={priority}
            onValueChange={(value) => setValue('priority', value as TaskPriority)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-sm">
              {Object.values(TaskPriority).map((p) => (
                <SelectItem key={p} value={p}>
                  {taskPriorityLabels[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Data de Vencimento</Label>
        <Input id="dueDate" type="date" {...register('dueDate')} />
      </div>

      <div className="space-y-2">
        <Label>Atribuir Para</Label>
        <Select
          value={assignedToId || ''}
          onValueChange={(value) => setValue('assignedToId', value === 'unassigned' ? '' : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent className="rounded-sm">
            <SelectItem value="unassigned">Não atribuído</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}

export function TaskForm({ open, onOpenChange, task, onSubmit, isLoading }: TaskFormProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const isEditing = !!task;

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => authService.getAllUsers(),
    enabled: open,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: '',
      assignedToId: '',
    },
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title || '',
        description: task.description || '',
        status: task.status || TaskStatus.TODO,
        priority: task.priority || TaskPriority.MEDIUM,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        assignedToId: task.assignedTo || '',
      });
    } else {
      reset({
        title: '',
        description: '',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueDate: '',
        assignedToId: '',
      });
    }
  }, [task, reset]);

  const status = watch('status') || TaskStatus.TODO;
  const priority = watch('priority') || TaskPriority.MEDIUM;
  const assignedToId = watch('assignedToId') || '';

  const handleFormSubmit = async (data: CreateTaskInput) => {
    const processedData = {
      ...data,
      dueDate: data.dueDate
        ? new Date(data.dueDate + 'T12:00:00.000Z').toISOString()
        : data.dueDate,
    };
    await onSubmit(processedData);
    reset();
    onOpenChange(false);
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
    }
    onOpenChange(isOpen);
  };

  const title = isEditing ? 'Editar Tarefa' : 'Criar Tarefa';
  const description = isEditing
    ? 'Faça alterações na sua tarefa aqui.'
    : 'Adicione uma nova tarefa à sua lista.';

  const formFieldsProps: FormFieldsProps = {
    register,
    errors,
    status,
    priority,
    assignedToId,
    setValue,
    users,
  };

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormFields {...formFieldsProps} />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 px-4">
          <FormFields {...formFieldsProps} />

          <DrawerFooter className="px-0">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
            </Button>
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Cancelar
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
