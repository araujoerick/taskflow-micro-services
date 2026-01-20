import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationMetadata } from '../notifications/interfaces/notification-metadata.interface';

export interface WebSocketNotificationPayload {
  id: string;
  userId: string;
  type: string;
  message: string;
  taskId?: string;
  metadata?: NotificationMetadata | null;
  read: boolean;
  createdAt: Date;
}

@Injectable()
export class WebSocketPublisherService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(WebSocketPublisherService.name);
  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;
  private readonly queueName: string;
  private isHealthy = false;

  constructor(private readonly configService: ConfigService) {
    this.queueName =
      this.configService.get<string>('RABBITMQ_WEBSOCKET_QUEUE') ||
      'notifications';
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitmqUrl) {
        this.logger.warn(
          'RABBITMQ_URL not defined, WebSocket publishing disabled',
        );
        return;
      }

      const connection = await amqp.connect(rabbitmqUrl);
      this.connection = connection;
      this.channel = await connection.createChannel();
      await this.channel.assertQueue(this.queueName, { durable: true });

      this.isHealthy = true;
      this.logger.log(
        `Connected to RabbitMQ for WebSocket publishing (queue: ${this.queueName})`,
      );

      connection.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isHealthy = false;
      });

      connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isHealthy = false;
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ for WebSocket', error);
      this.isHealthy = false;
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await (
          this.connection as unknown as { close: () => Promise<void> }
        ).close();
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }

  publishNotification(notification: Notification): void {
    if (!this.isHealthy || !this.channel) {
      this.logger.warn(
        'Cannot publish WebSocket notification: RabbitMQ not connected',
      );
      return;
    }

    try {
      const payload: WebSocketNotificationPayload = {
        id: notification.id,
        userId: notification.userId,
        type: notification.type,
        message: notification.message,
        taskId: notification.taskId,
        metadata: notification.metadata,
        read: notification.read,
        createdAt: notification.createdAt,
      };

      const message = Buffer.from(JSON.stringify(payload));
      this.channel.sendToQueue(this.queueName, message, { persistent: true });

      this.logger.log(
        `Published WebSocket notification for user ${notification.userId}`,
      );
    } catch (error) {
      this.logger.error('Failed to publish WebSocket notification', error);
    }
  }

  publishNotifications(notifications: Notification[]): void {
    for (const notification of notifications) {
      this.publishNotification(notification);
    }
  }

  /**
   * Publish a task_changed event for cache invalidation across all users
   * without creating a notification record
   */
  publishTaskChanged(taskId: string, type: string): void {
    if (!this.isHealthy || !this.channel) {
      this.logger.warn('Cannot publish task_changed: RabbitMQ not connected');
      return;
    }

    try {
      // Create a minimal payload that triggers task_changed broadcast
      const payload: WebSocketNotificationPayload = {
        id: `task-deleted-${taskId}`,
        userId: 'system',
        type: type,
        message: 'Task deleted',
        taskId: taskId,
        metadata: null,
        read: true,
        createdAt: new Date(),
      };

      const message = Buffer.from(JSON.stringify(payload));
      this.channel.sendToQueue(this.queueName, message, { persistent: true });

      this.logger.log(`Published task_changed event for task ${taskId}`);
    } catch (error) {
      this.logger.error('Failed to publish task_changed event', error);
    }
  }

  isConnected(): boolean {
    return this.isHealthy;
  }
}
