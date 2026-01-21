import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  accessToken: string;
  refreshToken: string;
}

interface ValidateResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ErrorResponse {
  message: string | string[];
  statusCode: number;
}

interface LogoutResponse {
  message: string;
}

describe('Auth Module (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let accessToken: string;
  let refreshToken: string;

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

    // Clean database before tests
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user with valid data', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecureP@ss123',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('user');
          expect(body).toHaveProperty('accessToken');
          expect(body).toHaveProperty('refreshToken');
          expect(body.user.email).toBe('john@example.com');
          expect(body.user).not.toHaveProperty('password');
          expect(body.user).not.toHaveProperty('refreshTokenId');
        });
    });

    it('should reject weak password (less than 8 characters)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane@example.com',
          password: 'weak',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          const messages = Array.isArray(body.message)
            ? body.message
            : [body.message];
          const hasPasswordError = messages.some(
            (msg) =>
              msg.includes('Password must contain') ||
              msg.includes('password must be longer'),
          );
          expect(hasPasswordError).toBe(true);
        });
    });

    it('should reject password without uppercase letter', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane2@example.com',
          password: 'weakpass123!',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          const messages = Array.isArray(body.message)
            ? body.message
            : [body.message];
          const hasPasswordError = messages.some((msg) =>
            msg.includes('Password must contain'),
          );
          expect(hasPasswordError).toBe(true);
        });
    });

    it('should reject password without special character', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'jane3@example.com',
          password: 'WeakPass123',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          const messages = Array.isArray(body.message)
            ? body.message
            : [body.message];
          const hasPasswordError = messages.some((msg) =>
            msg.includes('Password must contain'),
          );
          expect(hasPasswordError).toBe(true);
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Duplicate',
          email: 'john@example.com', // Already registered
          password: 'SecureP@ss123',
        })
        .expect(409)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Email already exists');
        });
    });

    it('should normalize email to lowercase', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test User',
          email: 'TEST@EXAMPLE.COM',
          password: 'SecureP@ss123',
        })
        .expect(201)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body.user.email).toBe('test@example.com');
        });
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Invalid Email',
          email: 'not-an-email',
          password: 'SecureP@ss123',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toContain('email must be an email');
        });
    });

    it('should reject missing required fields', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'missing@example.com',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'SecureP@ss123',
        })
        .expect(200)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('accessToken');
          expect(body).toHaveProperty('refreshToken');
          expect(body.user).not.toHaveProperty('password');
          accessToken = body.accessToken;
          refreshToken = body.refreshToken;
        });
    });

    it('should login with case-insensitive email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'JOHN@EXAMPLE.COM',
          password: 'SecureP@ss123',
        })
        .expect(200);
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecureP@ss123',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Invalid credentials');
        });
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'john@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          expect(body.message).toBe('Invalid credentials');
        });
    });

    it('should reject missing credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/validate (GET)', () => {
    it('should validate valid access token', () => {
      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as ValidateResponse;
          expect(body.valid).toBe(true);
          expect(body.user).toHaveProperty('id');
          expect(body.user).toHaveProperty('email');
          expect(body.user).not.toHaveProperty('password');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/auth/validate').expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject malformed Authorization header', () => {
      return request(app.getHttpServer())
        .get('/auth/validate')
        .set('Authorization', 'invalid-format')
        .expect(401);
    });
  });

  describe('/auth/refresh (POST)', () => {
    beforeAll(async () => {
      // Login again to get fresh tokens since previous tests may have logged out
      const res = await request(app.getHttpServer()).post('/auth/login').send({
        email: 'john@example.com',
        password: 'SecureP@ss123',
      });
      const body = res.body as AuthResponse;
      accessToken = body.accessToken;
      refreshToken = body.refreshToken;
    });

    it('should refresh tokens with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          const body = res.body as AuthResponse;
          expect(body).toHaveProperty('accessToken');
          expect(body).toHaveProperty('refreshToken');
          expect(body).toHaveProperty('user');
          accessToken = body.accessToken;
          refreshToken = body.refreshToken;
        });
    });

    it('should reject invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });

    it('should reject missing refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          const body = res.body as LogoutResponse;
          expect(body.message).toBe('Logged out successfully');
        });
    });

    it('should reject logout without token', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });

    it('should reject refresh token after logout', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });
  });

  describe('Security Tests', () => {
    it('should not expose sensitive data in error messages', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password',
        })
        .expect(401);

      const body = response.body as ErrorResponse;
      expect(body.message).toBe('Invalid credentials');
    });

    it('should reject unknown fields in request body', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Security Test',
          email: 'security@example.com',
          password: 'SecureP@ss123',
          isAdmin: true,
          maliciousField: 'hack',
        })
        .expect(400)
        .expect((res) => {
          const body = res.body as ErrorResponse;
          const messages = Array.isArray(body.message)
            ? body.message
            : [body.message];
          const hasWhitelistError = messages.some(
            (msg) =>
              msg.includes('should not exist') ||
              msg.includes('property should not exist'),
          );
          expect(hasWhitelistError).toBe(true);
        });
    });
  });
});
