import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import type {
  TaskEventPayload,
  TaskCreatedData,
  TaskUpdatedData,
  TaskAssignedData,
  TaskCommentedData,
} from '../rabbitmq/interfaces/task-event.interface';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createTaskCreatedNotification(
    payload: TaskEventPayload<TaskCreatedData>,
  ) {
    const { taskId, userId, data } = payload;

    // Notify task creator (if needed) and other interested users
    // For now, we'll create a notification for the creator
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.TASK_CREATED,
      message: `Task "${data.title}" has been created`,
      taskId,
      metadata: {
        taskTitle: data.title,
        taskStatus: data.status,
        taskPriority: data.priority,
      },
    });

    await this.notificationRepository.save(notification);
    this.logger.log(`Created TASK_CREATED notification for user ${userId}`);

    return notification;
  }

  async createTaskUpdatedNotification(
    payload: TaskEventPayload<TaskUpdatedData>,
  ) {
    const { taskId, userId, data } = payload;

    // Notify assignee and creator if they're different from the updater
    const usersToNotify = new Set<string>();

    if (data.assignedToId && data.assignedToId !== userId) {
      usersToNotify.add(data.assignedToId);
    }

    if (data.createdById && data.createdById !== userId) {
      usersToNotify.add(data.createdById);
    }

    if (usersToNotify.size === 0) {
      return [];
    }

    // Use transaction for batch insert to ensure atomicity
    return await this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const notifications: Notification[] = [];

        for (const targetUserId of usersToNotify) {
          const notification = this.notificationRepository.create({
            userId: targetUserId,
            type: NotificationType.TASK_UPDATED,
            message: `Task "${data.title}" has been updated`,
            taskId,
            metadata: {
              taskTitle: data.title,
              changes: data.changes || {},
              updatedBy: userId,
            },
          });

          notifications.push(notification);
        }

        const saved = await transactionalEntityManager.save(notifications);
        this.logger.log(`Created ${saved.length} TASK_UPDATED notifications`);
        return saved;
      },
    );
  }

  async createTaskAssignedNotification(
    payload: TaskEventPayload<TaskAssignedData>,
  ) {
    const { taskId, userId, data } = payload;

    // Notify the assignee (if not self-assignment)
    if (data.assignedToId && data.assignedToId !== userId) {
      const notification = this.notificationRepository.create({
        userId: data.assignedToId,
        type: NotificationType.TASK_ASSIGNED,
        message: `You have been assigned to task "${data.title}"`,
        taskId,
        metadata: {
          taskTitle: data.title,
          taskStatus: data.status,
          taskPriority: data.priority,
          assignedBy: userId,
        },
      });

      await this.notificationRepository.save(notification);
      this.logger.log(
        `Created TASK_ASSIGNED notification for user ${data.assignedToId}`,
      );

      return notification;
    }

    return null;
  }

  async createTaskCommentedNotification(
    payload: TaskEventPayload<TaskCommentedData>,
  ) {
    const { taskId, userId, data } = payload;

    // Notify task creator and assignee (if they're not the commenter)
    const usersToNotify = new Set<string>();

    if (data.assignedToId && data.assignedToId !== userId) {
      usersToNotify.add(data.assignedToId);
    }

    if (data.createdById && data.createdById !== userId) {
      usersToNotify.add(data.createdById);
    }

    if (usersToNotify.size === 0) {
      return [];
    }

    // Use transaction for batch insert to ensure atomicity
    return await this.notificationRepository.manager.transaction(
      async (transactionalEntityManager) => {
        const notifications: Notification[] = [];

        for (const targetUserId of usersToNotify) {
          const notification = this.notificationRepository.create({
            userId: targetUserId,
            type: NotificationType.TASK_COMMENTED,
            message: `New comment on task "${data.title}"`,
            taskId,
            metadata: {
              taskTitle: data.title,
              commentId: data.commentId,
              commentedBy: userId,
            },
          });

          notifications.push(notification);
        }

        const saved = await transactionalEntityManager.save(notifications);
        this.logger.log(`Created ${saved.length} TASK_COMMENTED notifications`);
        return saved;
      },
    );
  }

  async findAll(userId: string, filters: FilterNotificationDto) {
    const { type, read, page = 1, limit = 20 } = filters;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .orderBy('notification.createdAt', 'DESC');

    if (type !== undefined) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (read !== undefined) {
      queryBuilder.andWhere('notification.read = :read', { read });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(userId: string, markAsReadDto: MarkAsReadDto) {
    const { notificationIds } = markAsReadDto;

    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('id IN (:...ids)', { ids: notificationIds })
      .andWhere('userId = :userId', { userId })
      .execute();

    this.logger.log(
      `Marked ${result.affected} notifications as read for user ${userId}`,
    );

    return {
      message: `${result.affected} notification(s) marked as read`,
      affected: result.affected,
    };
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ read: true })
      .where('userId = :userId', { userId })
      .andWhere('read = :read', { read: false })
      .execute();

    this.logger.log(`Marked all notifications as read for user ${userId}`);

    return {
      message: `${result.affected} notification(s) marked as read`,
      affected: result.affected,
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, read: false },
    });

    return { count };
  }

  /**
   * Mark notifications related to a deleted task as obsolete
   * This updates the metadata to indicate the task was deleted
   */
  async handleTaskDeleted(payload: TaskEventPayload): Promise<void> {
    const { taskId } = payload;

    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({
        metadata: () => `metadata || '{"taskDeleted": true}'::jsonb`,
      })
      .where('taskId = :taskId', { taskId })
      .execute();

    this.logger.log(
      `Marked ${result.affected || 0} notifications as obsolete for deleted task ${taskId}`,
    );
  }
}
