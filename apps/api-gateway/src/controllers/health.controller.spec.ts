import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, MemoryHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { MicroserviceHealthIndicator } from '../health/microservice-health.indicator';
import { RabbitMQHealthIndicator } from '../health/rabbitmq-health.indicator';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockMemoryHealthIndicator = {
    checkHeap: jest.fn(),
  };

  const mockMicroserviceHealthIndicator = {
    isHealthy: jest.fn(),
  };

  const mockRabbitMQHealthIndicator = {
    isHealthy: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: MemoryHealthIndicator,
          useValue: mockMemoryHealthIndicator,
        },
        {
          provide: MicroserviceHealthIndicator,
          useValue: mockMicroserviceHealthIndicator,
        },
        {
          provide: RabbitMQHealthIndicator,
          useValue: mockRabbitMQHealthIndicator,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when all services are up', async () => {
      const healthyResult: HealthCheckResult = {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
        error: {},
        details: {
          memory_heap: { status: 'up' },
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(healthyResult);
      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          AUTH_SERVICE_URL: 'http://localhost:3001',
          TASKS_SERVICE_URL: 'http://localhost:3002',
          NOTIFICATIONS_SERVICE_URL: 'http://localhost:3003',
        };
        return config[key];
      });

      const result = await controller.check();

      expect(result).toEqual(healthyResult);
      expect(result.status).toBe('ok');
      expect(mockHealthCheckService.check).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
          expect.any(Function),
        ]),
      );
    });

    it('should return unhealthy status when a service is down', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          memory_heap: { status: 'up' },
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
        },
        error: {
          'notifications-service': {
            status: 'down',
            message: 'notifications-service is unreachable',
          },
        },
        details: {
          memory_heap: { status: 'up' },
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': {
            status: 'down',
            message: 'notifications-service is unreachable',
          },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result).toEqual(unhealthyResult);
      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('notifications-service');
    });

    it('should return unhealthy status when RabbitMQ is down', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          memory_heap: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
        error: {
          rabbitmq: {
            status: 'down',
            message: 'RabbitMQ is not connected',
          },
        },
        details: {
          memory_heap: { status: 'up' },
          rabbitmq: {
            status: 'down',
            message: 'RabbitMQ is not connected',
          },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result).toEqual(unhealthyResult);
      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('rabbitmq');
    });

    it('should return unhealthy status when memory limit is exceeded', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
        error: {
          memory_heap: {
            status: 'down',
            message: 'Memory heap exceeded 150MB',
          },
        },
        details: {
          memory_heap: {
            status: 'down',
            message: 'Memory heap exceeded 150MB',
          },
          rabbitmq: { status: 'up' },
          'auth-service': { status: 'up' },
          'tasks-service': { status: 'up' },
          'notifications-service': { status: 'up' },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result).toEqual(unhealthyResult);
      expect(result.status).toBe('error');
      expect(result.error).toHaveProperty('memory_heap');
    });

    it('should check all required health indicators', async () => {
      const healthyResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };

      mockHealthCheckService.check.mockResolvedValue(healthyResult);
      mockConfigService.get.mockReturnValue('http://localhost:3001');

      await controller.check();

      // Verify check was called with 5 indicator functions
      expect(mockHealthCheckService.check).toHaveBeenCalledTimes(1);
      const checkArgs = mockHealthCheckService.check.mock.calls[0][0];
      expect(checkArgs).toHaveLength(5);

      // All args should be functions
      checkArgs.forEach((arg: unknown) => {
        expect(typeof arg).toBe('function');
      });
    });

    it('should use correct service URLs from config', async () => {
      const healthyResult: HealthCheckResult = {
        status: 'ok',
        info: {},
        error: {},
        details: {},
      };

      mockHealthCheckService.check.mockImplementation(async (indicators) => {
        // Execute each indicator function to trigger config reads
        for (const indicator of indicators) {
          try {
            await indicator();
          } catch {
            // Ignore errors from mocked indicators
          }
        }
        return healthyResult;
      });

      mockConfigService.get.mockImplementation((key: string) => {
        const config: Record<string, string> = {
          AUTH_SERVICE_URL: 'http://auth:3001',
          TASKS_SERVICE_URL: 'http://tasks:3002',
          NOTIFICATIONS_SERVICE_URL: 'http://notifications:3003',
        };
        return config[key];
      });

      await controller.check();

      expect(mockConfigService.get).toHaveBeenCalledWith('AUTH_SERVICE_URL');
      expect(mockConfigService.get).toHaveBeenCalledWith('TASKS_SERVICE_URL');
      expect(mockConfigService.get).toHaveBeenCalledWith('NOTIFICATIONS_SERVICE_URL');
    });

    it('should handle multiple services being down simultaneously', async () => {
      const unhealthyResult: HealthCheckResult = {
        status: 'error',
        info: {
          memory_heap: { status: 'up' },
        },
        error: {
          rabbitmq: {
            status: 'down',
            message: 'RabbitMQ is not connected',
          },
          'auth-service': {
            status: 'down',
            message: 'auth-service is unreachable',
          },
          'tasks-service': {
            status: 'down',
            message: 'tasks-service is unreachable',
          },
          'notifications-service': {
            status: 'down',
            message: 'notifications-service is unreachable',
          },
        },
        details: {
          memory_heap: { status: 'up' },
          rabbitmq: {
            status: 'down',
            message: 'RabbitMQ is not connected',
          },
          'auth-service': {
            status: 'down',
            message: 'auth-service is unreachable',
          },
          'tasks-service': {
            status: 'down',
            message: 'tasks-service is unreachable',
          },
          'notifications-service': {
            status: 'down',
            message: 'notifications-service is unreachable',
          },
        },
      };

      mockHealthCheckService.check.mockResolvedValue(unhealthyResult);

      const result = await controller.check();

      expect(result.status).toBe('error');
      expect(Object.keys(result.error || {})).toHaveLength(4);
    });
  });
});
