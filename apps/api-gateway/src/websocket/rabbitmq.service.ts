import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConsumeMessage } from 'amqplib';
import { environment } from '../config/environment';

export interface NotificationPayload {
  userId: string;
  type: string;
  message: string;
  taskId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.AmqpConnectionManager | null = null;
  private channelWrapper: ChannelWrapper | null = null;
  private messageHandlers: ((notification: NotificationPayload) => void)[] = [];

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const { host, port, user, password, queue } = environment.rabbitmq;
      const connectionUrl = `amqp://${user}:${password}@${host}:${port}`;

      this.logger.log(`Connecting to RabbitMQ at ${host}:${port}...`);

      this.connection = amqp.connect([connectionUrl], {
        heartbeatIntervalInSeconds: 30,
      });

      this.connection.on('connect', () => {
        this.logger.log('Successfully connected to RabbitMQ');
      });

      this.connection.on('disconnect', (err) => {
        this.logger.error('Disconnected from RabbitMQ', err);
      });

      this.channelWrapper = this.connection.createChannel({
        json: false,
        setup: async (channel: amqp.Channel) => {
          await channel.assertQueue(queue, { durable: true });
          await channel.consume(queue, this.handleMessage.bind(this), { noAck: true });
          this.logger.log(`Listening for messages on queue: ${queue}`);
        },
      });

      // Connect asynchronously without blocking application startup
      this.channelWrapper.waitForConnect().then(() => {
        this.logger.log('RabbitMQ channel ready');
      }).catch((error) => {
        this.logger.error('Failed to establish RabbitMQ channel', error);
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ', error);
      // Don't throw - allow app to start even if RabbitMQ is unavailable
    }
  }

  private handleMessage(msg: ConsumeMessage | null): void {
    if (!msg) {
      return;
    }

    try {
      const content = msg.content.toString();
      const notification: NotificationPayload = JSON.parse(content);

      this.logger.debug(`Received notification: ${JSON.stringify(notification)}`);

      // Notify all registered handlers
      this.messageHandlers.forEach((handler) => {
        try {
          handler(notification);
        } catch (error) {
          this.logger.error('Error in notification handler', error);
        }
      });
    } catch (error) {
      this.logger.error('Failed to parse notification message', error);
    }
  }

  onNotification(handler: (notification: NotificationPayload) => void): void {
    this.messageHandlers.push(handler);
  }

  removeNotificationHandler(handler: (notification: NotificationPayload) => void): void {
    const index = this.messageHandlers.indexOf(handler);
    if (index > -1) {
      this.messageHandlers.splice(index, 1);
    }
  }

  private async disconnect(): Promise<void> {
    try {
      if (this.channelWrapper) {
        await this.channelWrapper.close();
        this.channelWrapper = null;
      }

      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }

      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error);
    }
  }
}
