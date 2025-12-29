import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';
import { FilterNotificationDto } from './dto/filter-notification.dto';
import { MarkAsReadDto } from './dto/mark-as-read.dto';
import { WebSocketPublisherService } from '../websocket/websocket-publisher.service';
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
    private readonly webSocketPublisher: WebSocketPublisherService,
  ) {}

  async createTaskCreatedNotification(
    payload: TaskEventPayload<TaskCreatedData>,
  ) {
    const { taskId, userId, data } = payload;

    // Only notify the assignee if one exists and it's not the creator
    if (!data.assignedToId || data.assignedToId === userId) {
      this.logger.log(
        `No notification needed for TASK_CREATED - no assignee or self-assignment`,
      );
      return null;
    }

    const notification = this.notificationRepository.create({
      userId: data.assignedToId,
      type: NotificationType.TASK_CREATED,
      message: `You have been assigned to a new task "${data.title}"`,
      taskId,
      metadata: {
        taskTitle: data.title,
        taskStatus: data.status,
        taskPriority: data.priority,
        createdBy: userId,
      },
    });

    const saved = await this.notificationRepository.save(notification);
    this.logger.log(
      `Created TASK_CREATED notification for assignee ${data.assignedToId}`,
    );

    await this.webSocketPublisher.publishNotification(saved);

    return saved;
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

        await this.webSocketPublisher.publishNotifications(saved);

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

      const saved = await this.notificationRepository.save(notification);
      this.logger.log(
        `Created TASK_ASSIGNED notification for user ${data.assignedToId}`,
      );

      await this.webSocketPublisher.publishNotification(saved);

      return saved;
    }

    return null;
  }

  async createTaskCommentedNotification(
    payload: TaskEventPayload<TaskCommentedData>,
  ) {
    const { taskId, userId, data } = payload;

    this.logger.log(
      `Processing TASK_COMMENTED - taskId: ${taskId}, commenter: ${userId}, creator: ${data.createdById}, assignee: ${data.assignedToId}, previousCommenters: ${data.previousCommenterIds?.length || 0}`,
    );

    // Notify task creator, assignee, and previous commenters (if they're not the current commenter)
    const usersToNotify = new Set<string>();

    // Add assignee
    if (data.assignedToId && data.assignedToId !== userId) {
      usersToNotify.add(data.assignedToId);
      this.logger.log(`Will notify assignee: ${data.assignedToId}`);
    }

    // Add creator
    if (data.createdById && data.createdById !== userId) {
      usersToNotify.add(data.createdById);
      this.logger.log(`Will notify creator: ${data.createdById}`);
    }

    // Add all previous commenters
    if (data.previousCommenterIds && data.previousCommenterIds.length > 0) {
      for (const commenterId of data.previousCommenterIds) {
        if (commenterId !== userId) {
          usersToNotify.add(commenterId);
        }
      }
      this.logger.log(
        `Will also notify ${data.previousCommenterIds.length} previous commenters`,
      );
    }

    if (usersToNotify.size === 0) {
      this.logger.warn(
        `No users to notify - commenter is the only participant`,
      );
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

        await this.webSocketPublisher.publishNotifications(saved);

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

  async delete(id: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);

    this.logger.log(`Deleted notification ${id} for user ${userId}`);

    return { message: 'Notification deleted successfully' };
  }

  /**
   * Handle task deleted event
   * - Marks existing notifications as obsolete
   * - Publishes task_changed event for cache invalidation across all users
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

    await this.webSocketPublisher.publishTaskChanged(taskId, 'TASK_DELETED');
  }
}
