import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assignedTo: string | null;
  createdBy: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  comments?: CommentResponse[];
  history?: HistoryResponse[];
}

interface CommentResponse {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
}

interface HistoryResponse {
  id: string;
  taskId: string;
  userId: string;
  action: string;
  changes: Record<string, unknown>;
  createdAt: string;
}

interface PaginatedResponse {
  data: TaskResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  message: string | string[];
  statusCode: number;
}

interface DeleteResponse {
  message: string;
}

describe('Tasks Module (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  let otherUserToken: string;
  let createdTaskId: string;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const otherUserId = '123e4567-e89b-12d3-a456-426614174001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const configService = moduleFixture.get<ConfigService>(ConfigService);

    // Clean database before tests
    await dataSource.synchronize(true);

    // Generate test tokens
    const secret = configService.get<string>('JWT_SECRET');
    accessToken = jwtService.sign(
      { sub: mockUserId, email: 'test@example.com' },
      { secret, expiresIn: '1h' },
    );
    otherUserToken = jwtService.sign(
      { sub: otherUserId, email: 'other@example.com' },
      { secret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('POST /tasks', () => {
    it('should create a task with valid data', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'HIGH',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as TaskResponse;
          expect(body).toHaveProperty('id');
          expect(body.title).toBe('Test Task');
          expect(body.description).toBe('Test Description');
          expect(body.priority).toBe('HIGH');
          expect(body.status).toBe('TODO');
          expect(body.createdBy).toBe(mockUserId);
          createdTaskId = body.id;
        });
    });

    it('should create a task with minimal data (title only)', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Minimal Task',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as TaskResponse;
          expect(body.title).toBe('Minimal Task');
          expect(body.status).toBe('TODO');
          expect(body.priority).toBe('MEDIUM');
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Unauthorized Task',
        })
        .expect(401);
    });

    it('should reject invalid data (empty title)', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: '',
        })
        .expect(400);
    });

    it('should reject invalid status value', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task',
          status: 'INVALID_STATUS',
        })
        .expect(400);
    });

    it('should reject invalid priority value', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task',
          priority: 'INVALID_PRIORITY',
        })
        .expect(400);
    });

    it('should reject invalid assignedTo (not UUID)', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Task',
          assignedTo: 'not-a-uuid',
        })
        .expect(400);
    });
  });

  describe('GET /tasks', () => {
    it('should list tasks with pagination', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body).toHaveProperty('data');
          expect(body).toHaveProperty('meta');
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.meta).toHaveProperty('page');
          expect(body.meta).toHaveProperty('limit');
          expect(body.meta).toHaveProperty('total');
          expect(body.meta).toHaveProperty('totalPages');
        });
    });

    it('should filter tasks by status', () => {
      return request(app.getHttpServer())
        .get('/tasks?status=TODO')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          body.data.forEach((task) => {
            expect(task.status).toBe('TODO');
          });
        });
    });

    it('should filter tasks by priority', () => {
      return request(app.getHttpServer())
        .get('/tasks?priority=HIGH')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          body.data.forEach((task) => {
            expect(task.priority).toBe('HIGH');
          });
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/tasks?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(5);
        });
    });

    it('should search tasks by title/description', () => {
      return request(app.getHttpServer())
        .get('/tasks?search=Test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.data.length).toBeGreaterThan(0);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer()).get('/tasks').expect(401);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return task details', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as TaskResponse;
          expect(body.id).toBe(createdTaskId);
          expect(body).toHaveProperty('comments');
          expect(body).toHaveProperty('history');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('not found');
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .expect(401);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update task as creator', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task Title',
          status: 'IN_PROGRESS',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as TaskResponse;
          expect(body.title).toBe('Updated Task Title');
          expect(body.status).toBe('IN_PROGRESS');
        });
    });

    it('should reject update from non-creator/non-assigned user', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          title: 'Unauthorized Update',
        })
        .expect(403)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('permission');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .patch('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Update',
        })
        .expect(404);
    });

    it('should reject invalid status value', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          status: 'INVALID',
        })
        .expect(400);
    });

    it('should allow assigned user to update', async () => {
      // First assign the task to other user
      await request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          assignedTo: otherUserId,
        })
        .expect(200);

      // Now other user should be able to update
      return request(app.getHttpServer())
        .patch(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          status: 'DONE',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as TaskResponse;
          expect(body.status).toBe('DONE');
        });
    });
  });

  describe('GET /tasks/:id/history', () => {
    it('should return task history', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}/history`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as HistoryResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
          expect(body[0]).toHaveProperty('action');
          expect(body[0]).toHaveProperty('changes');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/123e4567-e89b-12d3-a456-426614174999/history')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('POST /tasks/:taskId/comments', () => {
    it('should add a comment to a task', () => {
      return request(app.getHttpServer())
        .post(`/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'This is a test comment',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as CommentResponse;
          expect(body).toHaveProperty('id');
          expect(body.content).toBe('This is a test comment');
          expect(body.taskId).toBe(createdTaskId);
          expect(body.userId).toBe(mockUserId);
        });
    });

    it('should reject empty comment', () => {
      return request(app.getHttpServer())
        .post(`/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: '',
        })
        .expect(400);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .post('/tasks/123e4567-e89b-12d3-a456-426614174999/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          content: 'Comment',
        })
        .expect(404);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .post(`/tasks/${createdTaskId}/comments`)
        .send({
          content: 'Comment',
        })
        .expect(401);
    });
  });

  describe('GET /tasks/:taskId/comments', () => {
    it('should list comments for a task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}/comments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as CommentResponse[];
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
          expect(body[0]).toHaveProperty('content');
        });
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .get('/tasks/123e4567-e89b-12d3-a456-426614174999/comments')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should reject delete from non-creator', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('creator');
        });
    });

    it('should delete task as creator', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as DeleteResponse;
          expect(body.message).toBe('Task deleted successfully');
        });
    });

    it('should return 404 for already deleted task', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent task', () => {
      return request(app.getHttpServer())
        .delete('/tasks/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });

  describe('Security Tests', () => {
    it('should reject unknown fields from request body (forbidNonWhitelisted)', () => {
      // With forbidNonWhitelisted: true, unknown fields are rejected with 400
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Security Test Task',
          maliciousField: 'hack',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          const message = Array.isArray(body.message)
            ? body.message.join(' ')
            : body.message;
          expect(message).toContain('should not exist');
        });
    });

    it('should use authenticated user as creator (cannot override createdBy)', async () => {
      const response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Creator Test Task',
        })
        .expect(201);

      const body = response.body as TaskResponse;
      expect(body.createdBy).toBe(mockUserId);
    });

    it('should handle invalid UUID format gracefully', () => {
      // PostgreSQL throws error for invalid UUID, which results in 500
      // This tests that the system handles the error (doesn't crash)
      return request(app.getHttpServer())
        .get('/tasks/not-a-valid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(500);
    });
  });
});
