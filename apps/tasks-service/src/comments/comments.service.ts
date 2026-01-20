import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Task } from '../tasks/entities/task.entity';
import {
  TaskHistory,
  TaskAction,
} from '../history/entities/task-history.entity';
import { RabbitMQService, TaskEvent } from '../rabbitmq/rabbitmq.service';
import { HistoryChanges } from '../history/interfaces/history-changes.interface';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private commentsRepository: Repository<Comment>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(TaskHistory)
    private historyRepository: Repository<TaskHistory>,
    private rabbitmqService: RabbitMQService,
  ) {}

  async create(
    taskId: string,
    createCommentDto: CreateCommentDto,
    userId: string,
  ): Promise<Comment> {
    this.logger.log(`Creating comment on task ${taskId} by user ${userId}`);

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

    this.logger.log(
      `Comment ${savedComment.id} created successfully on task ${taskId}`,
    );

    // Record history
    await this.createHistory(taskId, userId, { comment: savedComment });

    // Get all users who have previously commented on this task (excluding current commenter)
    const previousCommenters = await this.commentsRepository
      .createQueryBuilder('comment')
      .select('DISTINCT comment.userId', 'userId')
      .where('comment.taskId = :taskId', { taskId })
      .andWhere('comment.userId != :userId', { userId })
      .getRawMany<{ userId: string }>();

    const previousCommenterIds = previousCommenters.map((c) => c.userId);

    await this.rabbitmqService.publishEvent(
      TaskEvent.TASK_COMMENTED,
      taskId,
      userId,
      {
        title: task.title,
        createdById: task.createdBy,
        assignedToId: task.assignedTo,
        commentId: savedComment.id,
        commentText: savedComment.content,
        previousCommenterIds,
      },
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

  private async createHistory(
    taskId: string,
    userId: string,
    changes: HistoryChanges,
  ): Promise<void> {
    const history = this.historyRepository.create({
      taskId,
      userId,
      action: TaskAction.COMMENTED,
      changes,
    });

    await this.historyRepository.save(history);
  }
}
