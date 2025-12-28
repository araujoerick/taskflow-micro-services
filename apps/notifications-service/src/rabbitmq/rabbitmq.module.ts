import { Module } from '@nestjs/common';
import { RabbitMQController } from './rabbitmq.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [RabbitMQController],
})
export class RabbitMQModule {}
