import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { environment } from './config/environment';

// Auth
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

// Controllers
import { AuthController } from './controllers/auth.controller';
import { TasksController } from './controllers/tasks.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { HealthController } from './controllers/health.controller';

// Services
import { ProxyService } from './proxy/proxy.service';
import { RabbitMQService } from './websocket/rabbitmq.service';

// WebSocket
import { NotificationsGateway } from './websocket/notifications.gateway';

@Module({
  imports: [
    // Config Module - Load .env file FIRST
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Passport and JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'default-secret-change-me',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
      }),
    }),

    // Rate Limiting
    ThrottlerModule.forRoot([
      {
        ttl: environment.throttle.ttl * 1000, // Convert to milliseconds
        limit: environment.throttle.limit,
      },
    ]),
  ],
  controllers: [
    AuthController,
    TasksController,
    NotificationsController,
    HealthController,
  ],
  providers: [
    // Auth
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    // Services
    ProxyService,
    RabbitMQService,

    // WebSocket
    NotificationsGateway,
  ],
})
export class AppModule {}
