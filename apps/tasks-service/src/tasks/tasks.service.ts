import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { TaskHistory, TaskAction } from '../history/entities/task-history.entity';
import { RabbitMQService, TaskEvent } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
    private rabbitmqService: RabbitMQService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const task = this.tasksRepository.create({
      ...createTaskDto,
      createdBy: userId,
    });

    const savedTask = await this.tasksRepository.save(task);

    // Record history
    await this.createHistory(
      savedTask.id,
      userId,
      TaskAction.CREATED,
      { task: savedTask },
    );

    // Publish event
    await this.rabbitmqService.publishEvent(
      TaskEvent.TASK_CREATED,
      savedTask.id,
      userId,
      savedTask,
    );

    return savedTask;
  }

  async findAll(filterDto: FilterTaskDto) {
    const { page = 1, limit = 10, status, priority, assignedTo, createdBy, search } = filterDto;

    const queryBuilder = this.tasksRepository.createQueryBuilder('task');

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (assignedTo) {
      queryBuilder.andWhere('task.assignedTo = :assignedTo', { assignedTo });
    }

    if (createdBy) {
      queryBuilder.andWhere('task.createdBy = :createdBy', { createdBy });
    }

    if (search) {
      queryBuilder.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      data: tasks,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['comments', 'history'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id);

    // Check permissions
    if (task.createdBy !== userId && task.assignedTo !== userId) {
      throw new ForbiddenException('You do not have permission to update this task');
    }

    const oldData = { ...task };
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.tasksRepository.save(task);

    // Determine action type
    let action = TaskAction.UPDATED;
    if (oldData.status !== updatedTask.status) {
      action = TaskAction.STATUS_CHANGED;
    } else if (oldData.assignedTo !== updatedTask.assignedTo) {
      action = TaskAction.ASSIGNED;
    }

    // Record history
    await this.createHistory(id, userId, action, {
      before: oldData,
      after: updatedTask,
    });

    // Publish event
    let event = TaskEvent.TASK_UPDATED;
    if (action === TaskAction.ASSIGNED) {
      event = TaskEvent.TASK_ASSIGNED;
    }

    await this.rabbitmqService.publishEvent(event, id, userId, {
      before: oldData,
      after: updatedTask,
    });

    return updatedTask;
  }

  async remove(id: string, userId: string) {
    const task = await this.findOne(id);

    // Check permissions
    if (task.createdBy !== userId) {
      throw new ForbiddenException('Only the task creator can delete this task');
    }

    await this.tasksRepository.remove(task);

    // Record history
    await this.createHistory(id, userId, TaskAction.DELETED, { task });

    // Publish event
    await this.rabbitmqService.publishEvent(
      TaskEvent.TASK_DELETED,
      id,
      userId,
      { task },
    );

    return { message: 'Task deleted successfully' };
  }

  async getHistory(taskId: string) {
    const task = await this.findOne(taskId);

    const history = await this.historyRepository.find({
      where: { taskId },
      order: { createdAt: 'DESC' },
    });

    return history;
  }

  private async createHistory(
    taskId: string,
    userId: string,
    action: TaskAction,
    changes: any,
  ) {
    const history = this.historyRepository.create({
      taskId,
      userId,
      action,
      changes,
    });

    await this.historyRepository.save(history);
  }
}
