import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

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

  constructor(private configService: ConfigService) {
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

      this.logger.log(`Connected to RabbitMQ and queue "${this.queueName}" asserted`);
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

  async publishEvent(event: TaskEvent, taskId: string, userId: string, data: any) {
    try {
      if (!this.channel) {
        this.logger.warn('RabbitMQ channel not available, skipping event publication');
        return;
      }

      const payload: TaskEventPayload = {
        event,
        taskId,
        userId,
        data,
        timestamp: new Date(),
      };

      const message = Buffer.from(JSON.stringify(payload));
      this.channel.sendToQueue(this.queueName, message, { persistent: true });

      this.logger.log(`Event published: ${event} for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event}`, error);
    }
  }
}
