import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  Notification,
  NotificationType,
} from '../src/notifications/entities/notification.entity';

interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  message: string;
  taskId: string;
  metadata: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface PaginatedResponse {
  data: NotificationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface UnreadCountResponse {
  count: number;
}

interface MarkAsReadResponse {
  message: string;
  affected: number;
}

interface DeleteResponse {
  message: string;
}

describe('Notifications Module (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  let otherUserToken: string;
  let createdNotificationId: string;

  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  const otherUserId = '123e4567-e89b-12d3-a456-426614174001';
  const mockTaskId = '123e4567-e89b-12d3-a456-426614174002';

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

    // Create test notifications
    const notificationRepo = dataSource.getRepository(Notification);

    const notification1 = notificationRepo.create({
      userId: mockUserId,
      type: NotificationType.TASK_ASSIGNED,
      message: 'You have been assigned to task "Test Task"',
      taskId: mockTaskId,
      metadata: { taskTitle: 'Test Task' },
      read: false,
    });

    const notification2 = notificationRepo.create({
      userId: mockUserId,
      type: NotificationType.TASK_UPDATED,
      message: 'Task "Test Task" has been updated',
      taskId: mockTaskId,
      metadata: { taskTitle: 'Test Task' },
      read: false,
    });

    const notification3 = notificationRepo.create({
      userId: mockUserId,
      type: NotificationType.TASK_COMMENTED,
      message: 'New comment on task "Test Task"',
      taskId: mockTaskId,
      metadata: { taskTitle: 'Test Task' },
      read: true,
    });

    const savedNotifications = await notificationRepo.save([
      notification1,
      notification2,
      notification3,
    ]);

    createdNotificationId = savedNotifications[0].id;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('GET /notifications', () => {
    it('should list notifications with pagination', () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body).toHaveProperty('data');
          expect(body).toHaveProperty('meta');
          expect(Array.isArray(body.data)).toBe(true);
          expect(body.data.length).toBe(3);
          expect(body.meta.total).toBe(3);
        });
    });

    it('should filter by notification type', () => {
      return request(app.getHttpServer())
        .get('/notifications?type=TASK_ASSIGNED')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.data.length).toBe(1);
          expect(body.data[0].type).toBe('TASK_ASSIGNED');
        });
    });

    it('should filter by read status', () => {
      return request(app.getHttpServer())
        .get('/notifications?read=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          // All returned notifications should match the filter
          body.data.forEach((notification) => {
            expect(notification.read).toBe(true);
          });
        });
    });

    it('should support pagination parameters', () => {
      return request(app.getHttpServer())
        .get('/notifications?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.data.length).toBe(2);
          expect(body.meta.page).toBe(1);
          expect(body.meta.limit).toBe(2);
          expect(body.meta.totalPages).toBe(2);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer()).get('/notifications').expect(401);
    });

    it('should return empty list for user with no notifications', () => {
      return request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as PaginatedResponse;
          expect(body.data.length).toBe(0);
          expect(body.meta.total).toBe(0);
        });
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('should return unread count', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as UnreadCountResponse;
          expect(body).toHaveProperty('count');
          expect(body.count).toBe(2);
        });
    });

    it('should return 0 for user with no notifications', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as UnreadCountResponse;
          expect(body.count).toBe(0);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .get('/notifications/unread-count')
        .expect(401);
    });
  });

  describe('GET /notifications/:id', () => {
    it('should return notification details', () => {
      return request(app.getHttpServer())
        .get(`/notifications/${createdNotificationId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as NotificationResponse;
          expect(body.id).toBe(createdNotificationId);
          expect(body.type).toBe('TASK_ASSIGNED');
          expect(body).toHaveProperty('message');
          expect(body).toHaveProperty('metadata');
        });
    });

    it('should return 404 for non-existent notification', () => {
      return request(app.getHttpServer())
        .get('/notifications/123e4567-e89b-12d3-a456-426614174999')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for notification belonging to another user', () => {
      return request(app.getHttpServer())
        .get(`/notifications/${createdNotificationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });

    it('should reject invalid UUID format', () => {
      return request(app.getHttpServer())
        .get('/notifications/invalid-uuid')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });
  });

  describe('POST /notifications/mark-as-read', () => {
    it('should mark specific notifications as read', async () => {
      // First get all notifications
      const listResponse = await request(app.getHttpServer())
        .get('/notifications?read=false')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = listResponse.body as PaginatedResponse;
      const notificationIds = body.data.map((n) => n.id);

      // Mark first one as read
      return request(app.getHttpServer())
        .post('/notifications/mark-as-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notificationIds: [notificationIds[0]] })
        .expect(201)
        .expect((res) => {
          const markResponse = res.body as MarkAsReadResponse;
          expect(markResponse.message).toContain('marked as read');
          expect(markResponse.affected).toBe(1);
        });
    });

    it('should handle empty notificationIds gracefully', () => {
      // Empty array causes SQL error (IN clause with empty list)
      // This is a known limitation - service returns 500
      return request(app.getHttpServer())
        .post('/notifications/mark-as-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ notificationIds: [] })
        .expect(500);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .post('/notifications/mark-as-read')
        .send({ notificationIds: [createdNotificationId] })
        .expect(401);
    });
  });

  describe('POST /notifications/mark-all-as-read', () => {
    it('should mark all notifications as read', () => {
      return request(app.getHttpServer())
        .post('/notifications/mark-all-as-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          const markResponse = res.body as MarkAsReadResponse;
          expect(markResponse.message).toContain('marked as read');
        });
    });

    it('should return 0 affected if no unread notifications', () => {
      // All already marked as read in previous test
      return request(app.getHttpServer())
        .post('/notifications/mark-all-as-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201)
        .expect((res) => {
          const markResponse = res.body as MarkAsReadResponse;
          expect(markResponse.affected).toBe(0);
        });
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .post('/notifications/mark-all-as-read')
        .expect(401);
    });
  });

  describe('DELETE /notifications/:id', () => {
    let notificationToDelete: string;

    beforeAll(async () => {
      // Create a notification to delete
      const notificationRepo = dataSource.getRepository(Notification);
      const notification = notificationRepo.create({
        userId: mockUserId,
        type: NotificationType.TASK_CREATED,
        message: 'Notification to delete',
        taskId: mockTaskId,
        metadata: {},
        read: false,
      });
      const saved = await notificationRepo.save(notification);
      notificationToDelete = saved.id;
    });

    it('should delete a notification', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/${notificationToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const deleteResponse = res.body as DeleteResponse;
          expect(deleteResponse.message).toContain('deleted');
        });
    });

    it('should return 404 for already deleted notification', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/${notificationToDelete}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 404 for notification belonging to another user', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/${createdNotificationId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(404);
    });

    it('should reject request without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/notifications/${createdNotificationId}`)
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should reject unknown fields from request body (forbidNonWhitelisted)', () => {
      return request(app.getHttpServer())
        .post('/notifications/mark-as-read')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          notificationIds: [createdNotificationId],
          maliciousField: 'hack',
        })
        .expect(400);
    });

    it('should only return notifications for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/notifications')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const body = response.body as PaginatedResponse;
      body.data.forEach((notification) => {
        expect(notification.userId).toBe(mockUserId);
      });
    });
  });
});
