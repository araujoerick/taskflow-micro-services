import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  const queueName = process.env.RABBITMQ_QUEUE || 'task-events';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: queueName,
      noAck: false, // Manual acknowledgment for reliability
      queueOptions: {
        durable: true, // Persist queue across RabbitMQ restarts
      },
      prefetchCount: 1, // Fair distribution of messages
    },
  });

  const corsOrigins = process.env.CORS_ORIGINS?.split(',') || [];
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.startAllMicroservices();
  logger.log(`RabbitMQ microservice connected to queue "${queueName}"`);

  const port = process.env.PORT ?? 3003;
  await app.listen(port);
  logger.log(`Notifications service is running on port ${port}`);
}
void bootstrap();
