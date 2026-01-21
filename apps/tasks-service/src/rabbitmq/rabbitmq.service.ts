import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
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
  data: unknown;
  timestamp: Date;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly queueName: string;
  private isHealthy = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;

  constructor(private configService: ConfigService) {
    this.queueName =
      this.configService.get<string>('RABBITMQ_QUEUE') || 'task-events';
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitmqUrl) {
        throw new Error('RABBITMQ_URL is not defined');
      }

      const connection = await amqp.connect(rabbitmqUrl);
      this.connection = connection as unknown as amqp.Connection;
      const channel = await connection.createChannel();
      this.channel = channel as unknown as amqp.Channel;
      await this.channel.assertQueue(this.queueName, { durable: true });

      this.isHealthy = true;
      this.reconnectAttempts = 0;
      this.logger.log(
        `Connected to RabbitMQ and queue "${this.queueName}" asserted`,
      );

      // Handle connection errors
      this.connection.on('error', (err: Error) => {
        this.logger.error('RabbitMQ connection error', err);
        this.isHealthy = false;
        void this.reconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed');
        this.isHealthy = false;
        void this.reconnect();
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      this.isHealthy = false;
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max reconnection attempts reached. Service degraded.');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    this.logger.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    setTimeout(() => void this.connect(), delay);
  }

  async onModuleDestroy() {
    try {
      if (this.channel) {
        await (
          this.channel as unknown as { close: () => Promise<void> }
        ).close();
      }
      if (this.connection) {
        await (
          this.connection as unknown as { close: () => Promise<void> }
        ).close();
      }
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection', error);
    }
  }

  publishEvent(
    event: TaskEvent,
    taskId: string,
    userId: string,
    data: unknown,
  ): void {
    if (!this.isHealthy || !this.channel) {
      this.logger.error(`Cannot publish event ${event}: RabbitMQ not healthy`);
      return;
    }

    try {
      const payload: TaskEventPayload = {
        event,
        taskId,
        userId,
        data,
        timestamp: new Date(),
      };

      const nestjsMessage = {
        pattern: event,
        data: payload,
      };

      const message = Buffer.from(JSON.stringify(nestjsMessage));
      this.channel.sendToQueue(this.queueName, message, { persistent: true });

      this.logger.log(`Event published: ${event} for task ${taskId}`);
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event}`, error);
      this.isHealthy = false;
      throw error;
    }
  }

  getHealth(): boolean {
    return this.isHealthy;
  }
}
