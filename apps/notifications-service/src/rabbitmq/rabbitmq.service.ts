import { Injectable, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { Channel, Message } from 'amqplib';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  TaskEventPayload,
  TaskCreatedData,
  TaskUpdatedData,
  TaskAssignedData,
  TaskCommentedData,
} from './interfaces/task-event.interface';

export enum TaskEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMMENTED = 'task.commented',
}

// Re-export for backward compatibility
export type { TaskEventPayload };

/**
 * RabbitMQ Service - Handles task events from the message queue
 * Uses NestJS native microservices
 */
@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * Handles TASK_CREATED events
   * @EventPattern decorator automatically subscribes to the pattern
   */
  @EventPattern(TaskEvent.TASK_CREATED)
  async handleTaskCreated(
    @Payload() payload: TaskEventPayload<TaskCreatedData>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received ${TaskEvent.TASK_CREATED} for task ${payload.taskId}`,
    );

    try {
      await this.notificationsService.createTaskCreatedNotification(payload);

      // Manual acknowledgment for reliability
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing ${TaskEvent.TASK_CREATED}`, error);

      // Nack and requeue on error
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * Handles TASK_UPDATED events
   */
  @EventPattern(TaskEvent.TASK_UPDATED)
  async handleTaskUpdated(
    @Payload() payload: TaskEventPayload<TaskUpdatedData>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received ${TaskEvent.TASK_UPDATED} for task ${payload.taskId}`,
    );

    try {
      await this.notificationsService.createTaskUpdatedNotification(payload);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing ${TaskEvent.TASK_UPDATED}`, error);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * Handles TASK_ASSIGNED events
   */
  @EventPattern(TaskEvent.TASK_ASSIGNED)
  async handleTaskAssigned(
    @Payload() payload: TaskEventPayload<TaskAssignedData>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received ${TaskEvent.TASK_ASSIGNED} for task ${payload.taskId}`,
    );

    try {
      await this.notificationsService.createTaskAssignedNotification(payload);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing ${TaskEvent.TASK_ASSIGNED}`, error);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * Handles TASK_COMMENTED events
   */
  @EventPattern(TaskEvent.TASK_COMMENTED)
  async handleTaskCommented(
    @Payload() payload: TaskEventPayload<TaskCommentedData>,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received ${TaskEvent.TASK_COMMENTED} for task ${payload.taskId}`,
    );

    try {
      await this.notificationsService.createTaskCommentedNotification(payload);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing ${TaskEvent.TASK_COMMENTED}`, error);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.nack(originalMsg, false, true);
    }
  }

  /**
   * Handles TASK_DELETED events
   * Marks all notifications related to the deleted task as obsolete
   */
  @EventPattern(TaskEvent.TASK_DELETED)
  async handleTaskDeleted(
    @Payload() payload: TaskEventPayload,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    this.logger.log(
      `Received ${TaskEvent.TASK_DELETED} for task ${payload.taskId}`,
    );

    try {
      await this.notificationsService.handleTaskDeleted(payload);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(`Error processing ${TaskEvent.TASK_DELETED}`, error);

      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as Message;
      channel.nack(originalMsg, false, true);
    }
  }
}
