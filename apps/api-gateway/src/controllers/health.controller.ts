import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/public.decorator';
import { MicroserviceHealthIndicator } from '../health/microservice-health.indicator';
import { RabbitMQHealthIndicator } from '../health/rabbitmq-health.indicator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memoryHealth: MemoryHealthIndicator,
    private readonly microserviceHealth: MicroserviceHealthIndicator,
    private readonly rabbitMQHealth: RabbitMQHealthIndicator,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Health check endpoint with dependency checks' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check() {
    return this.health.check([
      // Memory check
      () => this.memoryHealth.checkHeap('memory_heap', 150 * 1024 * 1024), // 150MB

      // RabbitMQ check
      () => this.rabbitMQHealth.isHealthy('rabbitmq'),

      // Microservices checks
      () =>
        this.microserviceHealth.isHealthy(
          'auth-service',
          this.configService.get<string>('AUTH_SERVICE_URL') || '',
        ),
      () =>
        this.microserviceHealth.isHealthy(
          'tasks-service',
          this.configService.get<string>('TASKS_SERVICE_URL') || '',
        ),
      () =>
        this.microserviceHealth.isHealthy(
          'notifications-service',
          this.configService.get<string>('NOTIFICATIONS_SERVICE_URL') || '',
        ),
    ]);
  }
}
