import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { environment } from './config/environment';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // CORS
  app.enableCors({
    origin: environment.cors.origin,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Task Management API Gateway')
    .setDescription('API Gateway for Task Management System with real-time notifications')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Tasks', 'Task management operations')
    .addTag('Notifications', 'User notifications management')
    .addTag('Health', 'Service health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(environment.port);

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🚀 API Gateway is running!                                  ║
║                                                                ║
║   📍 HTTP Server:      http://localhost:${environment.port}                   ║
║   📡 WebSocket:        ws://localhost:${environment.port}/notifications      ║
║   📚 API Docs:         http://localhost:${environment.port}/docs             ║
║   ❤️  Health Check:     http://localhost:${environment.port}/api/health      ║
║                                                                ║
║   Environment: ${environment.nodeEnv.padEnd(47)} ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
