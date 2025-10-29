import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
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
    // Passport and JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: environment.jwt.secret,
      signOptions: { expiresIn: environment.jwt.expiresIn },
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
