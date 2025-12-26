import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HttpModule } from '@nestjs/axios';
import { TerminusModule } from '@nestjs/terminus';
import type { StringValue } from 'ms';
import { validate } from './config/environment.validation';

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

// Health Indicators
import { MicroserviceHealthIndicator } from './health/microservice-health.indicator';
import { RabbitMQHealthIndicator } from './health/rabbitmq-health.indicator';

// Middlewares
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';

// WebSocket
import { NotificationsGateway } from './websocket/notifications.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),

    // Passport and JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '15m';

        if (!secret) {
          throw new Error('JWT_SECRET must be defined in environment variables');
        }

        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as StringValue,
          },
        };
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: (configService.get<number>('THROTTLE_TTL') || 60) * 1000,
          limit: configService.get<number>('THROTTLE_LIMIT') || 100,
        },
      ],
    }),

    // HTTP Module with axios
    HttpModule.register({
      timeout: 30000, // 30 seconds
      maxRedirects: 5,
    }),

    // Terminus for health checks
    TerminusModule,
  ],
  controllers: [AuthController, TasksController, NotificationsController, HealthController],
  providers: [
    // Auth
    JwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Services
    ProxyService,
    RabbitMQService,

    // Health Indicators
    MicroserviceHealthIndicator,
    RabbitMQHealthIndicator,

    // WebSocket
    NotificationsGateway,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, HttpLoggerMiddleware).forRoutes('*');
  }
}
