import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { NotificationsService } from '../notifications/notifications.service';

export enum TaskEvent {
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_DELETED = 'task.deleted',
  TASK_ASSIGNED = 'task.assigned',
  TASK_COMMENTED = 'task.commented',
}

export interface TaskEventPayload {
  event: TaskEvent;
  taskId: string;
  userId: string;
  data: any;
  timestamp: Date;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly queueName: string;

  constructor(
    private configService: ConfigService,
    private notificationsService: NotificationsService,
  ) {
    this.queueName = this.configService.get<string>('RABBITMQ_QUEUE') || 'task-events';
  }

  async onModuleInit() {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitmqUrl) {
        throw new Error('RABBITMQ_URL is not defined');
      }

      const connection = await amqp.connect(rabbitmqUrl);
      this.connection = connection as any;
      const channel = await connection.createChannel();
      this.channel = channel as any;
      await channel.assertQueue(this.queueName, { durable: true });

      // Set prefetch to 1 to ensure fair distribution of messages
      await channel.prefetch(1);

      this.logger.log(`Connected to RabbitMQ and consuming from queue "${this.queueName}"`);

      // Start consuming messages
      await channel.consume(
        this.queueName,
        async (msg) => {
          if (msg) {
            try {
              const payload: TaskEventPayload = JSON.parse(msg.content.toString());
              this.logger.log(`Received event: ${payload.event} for task ${payload.taskId}`);

              await this.handleTaskEvent(payload);

              // Acknowledge the message
              channel.ack(msg);
            } catch (error) {
              this.logger.error('Error processing message', error);
              // Reject and requeue the message
              channel.nack(msg, false, true);
            }
          }
        },
        { noAck: false }
      );
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
    }
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await (this.channel as any).close();
      }
      if (this.connection) {
        await (this.connection as any).close();
      }
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  private async handleTaskEvent(payload: TaskEventPayload) {
    switch (payload.event) {
      case TaskEvent.TASK_CREATED:
        await this.notificationsService.createTaskCreatedNotification(payload);
        break;
      case TaskEvent.TASK_UPDATED:
        await this.notificationsService.createTaskUpdatedNotification(payload);
        break;
      case TaskEvent.TASK_ASSIGNED:
        await this.notificationsService.createTaskAssignedNotification(payload);
        break;
      case TaskEvent.TASK_COMMENTED:
        await this.notificationsService.createTaskCommentedNotification(payload);
        break;
      default:
        this.logger.warn(`Unknown event type: ${payload.event}`);
    }
  }
}
