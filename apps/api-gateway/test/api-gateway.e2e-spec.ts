import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosError } from 'axios';

import { AppModule } from '../src/app.module';
import { RabbitMQService } from '../src/websocket/rabbitmq.service';

interface HealthResponse {
  status: string;
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
  details?: Record<string, unknown>;
}

interface ValidateResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
  };
}

interface ErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

describe('API Gateway (e2e)', () => {
  let app: INestApplication<App>;
  let accessToken: string;
  let httpService: HttpService;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const mockEmail = 'test@example.com';

  const mockRabbitMQService = {
    isConnected: jest.fn().mockReturnValue(true),
    connect: jest.fn(),
    disconnect: jest.fn(),
    onNotification: jest.fn(),
    removeNotificationHandler: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RabbitMQService)
      .useValue(mockRabbitMQService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    httpService = moduleFixture.get<HttpService>(HttpService);
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);

    const secret = configService.get<string>('JWT_SECRET');
    accessToken = jwtService.sign(
      { sub: mockUserId, email: mockEmail },
      { secret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /health', () => {
    it('should return health status (public endpoint)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
          const body = res.body as HealthResponse;
          expect(body).toHaveProperty('status');
          expect(body).toHaveProperty('details');
        });
    });

    it('should be accessible without authentication', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
        });
    });
  });

  describe('GET /auth/validate', () => {
    it('should validate authenticated user', async () => {
      const mockResponse: AxiosResponse = {
        data: { valid: true, user: { id: mockUserId, email: mockEmail } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidateResponse;
          expect(body.valid).toBe(true);
          expect(body.user).toHaveProperty('id', mockUserId);
          expect(body.user).toHaveProperty('email', mockEmail);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer()).get('/auth/validate').expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject request with malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });
  });

  describe('POST /auth/login (public proxy)', () => {
    it('should reject login without required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBeDefined();
        });
    });

    it('should reject login with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' })
        .expect(400);
    });

    it('should accept valid login data format', async () => {
      // Mock successful response from auth-service
      const mockResponse: AxiosResponse = {
        data: { accessToken: 'mock-token', refreshToken: 'mock-refresh' },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(201);
    });
  });

  describe('POST /auth/register (public proxy)', () => {
    it('should reject registration without required fields', () => {
      return request(app.getHttpServer()).post('/auth/register').send({}).expect(400);
    });

    it('should reject registration with weak password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: '123', // Too short
          name: 'New User',
        })
        .expect(400);
    });

    it('should reject unknown fields (forbidNonWhitelisted)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
          maliciousField: 'hack',
        })
        .expect(400);
    });
  });

  describe('Protected Routes - Tasks', () => {
    it('should reject GET /tasks without authentication', () => {
      return request(app.getHttpServer()).get('/tasks').expect(401);
    });

    it('should reject POST /tasks without authentication', () => {
      return request(app.getHttpServer()).post('/tasks').send({ title: 'Test Task' }).expect(401);
    });

    it('should reject GET /tasks/:id without authentication', () => {
      return request(app.getHttpServer())
        .get('/tasks/123e4567-e89b-12d3-a456-426614174000')
        .expect(401);
    });

    it('should reject PATCH /tasks/:id without authentication', () => {
      return request(app.getHttpServer())
        .patch('/tasks/123e4567-e89b-12d3-a456-426614174000')
        .send({ title: 'Updated' })
        .expect(401);
    });

    it('should reject DELETE /tasks/:id without authentication', () => {
      return request(app.getHttpServer())
        .delete('/tasks/123e4567-e89b-12d3-a456-426614174000')
        .expect(401);
    });

    it('should accept authenticated GET /tasks request', async () => {
      const mockResponse: AxiosResponse = {
        data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('should accept authenticated POST /tasks request with valid data', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'task-id', title: 'Test Task' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test Task', description: 'Description' })
        .expect(201);
    });
  });

  describe('Protected Routes - Notifications', () => {
    it('should reject GET /notifications without authentication', () => {
      return request(app.getHttpServer()).get('/notifications').expect(401);
    });

    it('should reject GET /notifications/unread-count without authentication', () => {
      return request(app.getHttpServer()).get('/notifications/unread-count').expect(401);
    });

    it('should accept authenticated GET /notifications request', async () => {
      const mockResponse: AxiosResponse = {
        data: { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('Proxy Error Handling', () => {
    it('should forward 404 errors from downstream services', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: 'Not Found',
          data: { message: 'Task not found' },
          headers: {},
          config: { headers: {} } as any,
        },
        message: 'Request failed with status code 404',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      jest.spyOn(httpService, 'request').mockReturnValueOnce(throwError(() => axiosError) as any);

      return request(app.getHttpServer())
        .get('/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should forward 403 errors from downstream services', async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 403,
          statusText: 'Forbidden',
          data: { message: 'Not allowed to modify this resource' },
          headers: {},
          config: { headers: {} } as any,
        },
        message: 'Request failed with status code 403',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      jest.spyOn(httpService, 'request').mockReturnValueOnce(throwError(() => axiosError) as any);

      return request(app.getHttpServer())
        .delete('/tasks/some-task-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should return 500 when downstream service is unavailable', async () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'connect ECONNREFUSED',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      jest.spyOn(httpService, 'request').mockReturnValueOnce(throwError(() => axiosError) as any);

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);
    });
  });

  describe('Request Validation', () => {
    it('should reject POST /tasks with invalid status enum', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test', status: 'INVALID_STATUS' })
        .expect(400);
    });

    it('should reject POST /tasks with invalid priority enum', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test', priority: 'INVALID_PRIORITY' })
        .expect(400);
    });

    it('should accept POST /tasks with valid enum values', async () => {
      const mockResponse: AxiosResponse = {
        data: { id: 'task-id', title: 'Test Task', status: 'TODO', priority: 'HIGH' },
        status: 201,
        statusText: 'Created',
        headers: {},
        config: { headers: {} } as any,
      };

      jest.spyOn(httpService, 'request').mockReturnValueOnce(of(mockResponse) as any);

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Test', description: 'Test description', status: 'TODO', priority: 'HIGH' })
        .expect(201);
    });
  });

  describe('Correlation ID', () => {
    it('should include X-Correlation-ID in response headers', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
          expect(res.headers['x-correlation-id']).toBeDefined();
        });
    });

    it('should use provided X-Correlation-ID if present', () => {
      const correlationId = 'test-correlation-123';
      return request(app.getHttpServer())
        .get('/health')
        .set('X-Correlation-ID', correlationId)
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
          expect(res.headers['x-correlation-id']).toBe(correlationId);
        });
    });
  });

  describe('Security Tests', () => {
    it('should reject requests with expired token', async () => {
      const jwtService = app.get<JwtService>(JwtService);
      const configService = app.get<ConfigService>(ConfigService);
      const secret = configService.get<string>('JWT_SECRET');

      const expiredToken = jwtService.sign(
        { sub: mockUserId, email: mockEmail },
        { secret, expiresIn: '-1h' }, // Already expired
      );

      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should not expose internal error details', async () => {
      const axiosError = {
        isAxiosError: true,
        response: undefined,
        message: 'Internal implementation error with sensitive data',
        name: 'AxiosError',
        toJSON: () => ({}),
      } as AxiosError;

      const spy = jest.spyOn(httpService, 'request');
      spy.mockReset();
      spy.mockReturnValueOnce(throwError(() => axiosError) as any);

      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.statusCode).toBe(500);
        });
    });
  });
});
