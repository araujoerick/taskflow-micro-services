import { Injectable } from '@nestjs/common';
import { HealthIndicatorResult, HealthIndicatorService } from '@nestjs/terminus';
import { RabbitMQService } from '../websocket/rabbitmq.service';

@Injectable()
export class RabbitMQHealthIndicator {
  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    const isConnected = this.rabbitMQService.isConnected();

    if (isConnected) {
      return indicator.up();
    }

    return indicator.down({ message: 'RabbitMQ is not connected' });
  }
}
