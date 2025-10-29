import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Task } from '../tasks/entities/task.entity';
import { TaskHistory, TaskAction } from '../history/entities/task-history.entity';
import { RabbitMQService, TaskEvent } from '../rabbitmq/rabbitmq.service';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
    private rabbitmqService: RabbitMQService,
  ) {}

  async create(taskId: string, createCommentDto: CreateCommentDto, userId: string) {
    // Verify task exists
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const comment = this.commentsRepository.create({
      ...createCommentDto,
      taskId,
      userId,
    });

    const savedComment = await this.commentsRepository.save(comment);

    // Record history
    await this.createHistory(taskId, userId, { comment: savedComment });

    // Publish event
    await this.rabbitmqService.publishEvent(
      TaskEvent.TASK_COMMENTED,
      taskId,
      userId,
      { comment: savedComment },
    );

    return savedComment;
  }

  async findByTask(taskId: string) {
    // Verify task exists
    const task = await this.tasksRepository.findOne({ where: { id: taskId } });
    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    const comments = await this.commentsRepository.find({
      where: { taskId },
      order: { createdAt: 'ASC' },
    });

    return comments;
  }

  private async createHistory(taskId: string, userId: string, changes: any) {
    const history = this.historyRepository.create({
      taskId,
      userId,
      action: TaskAction.COMMENTED,
      changes,
    });

    await this.historyRepository.save(history);
  }
}
