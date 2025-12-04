# Auth Service

Microservice for authentication and authorization with JWT.

## Technologies

- NestJS 11
- TypeORM 0.3.27
- PostgreSQL
- bcrypt 6.0.0
- JWT
- Zod (environment validation)

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env
# Edit .env with real values
```

**IMPORTANT**: Generate secure secrets:
```bash
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run migrations

```bash
npm run migration:run
```

### 4. Start service

```bash
npm run start:dev
```

## Endpoints

### POST /auth/register
Register a new user.

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Password requirements:**
- Minimum 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character (@$!%*?&)

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Authenticate user and return tokens.

**Body:**
```json
{
  "email": "john@example.com",
  "password": "SecureP@ss123"
}
```

**Response:** Same as register

### POST /auth/refresh
Renew access token using refresh token.

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

### POST /auth/logout
Invalidate user's refresh token.

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/validate
Validate access token (internal use).

**Headers:**
```
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com"
  }
}
```

## Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT with short expiration (15min)
- ✅ Refresh tokens with long expiration (7 days)
- ✅ Token revocation via JTI (JWT ID)
- ✅ Strong password validation
- ✅ Email normalization (lowercase, trim)
- ✅ Environment variables validated with Zod
- ✅ Audit logging for authentication events

## Migrations

```bash
# Generate new migration
npm run migration:generate -- src/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert last migration
npm run migration:revert
```

**NEVER use `synchronize: true` in production!**

## Development

### Running tests

```bash
# Unit tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

### Logging

The service uses NestJS Logger for structured logging:

- **INFO**: Successful operations (user registration, login)
- **WARN**: Failed authentication attempts
- **ERROR**: System errors

Example logs:
```
[Bootstrap] Auth service running on port 3001
[Bootstrap] Environment: development
[AuthService] New user registered: abc-123 (user@example.com)
[AuthService] User abc-123 logged in successfully
[AuthService] Failed login attempt for email: wrong@example.com
```

## Architecture

```
apps/auth-service/
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── interfaces/
│   │   │   └── jwt-payload.interface.ts
│   │   ├── validators/
│   │   │   └── password.validator.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/
│   │   └── entities/
│   │       └── user.entity.ts
│   ├── config/
│   │   ├── typeorm.config.ts
│   │   └── env.validation.ts
│   ├── migrations/
│   ├── app.module.ts
│   └── main.ts
└── test/
    └── auth.e2e-spec.ts
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment (development, production, test) |
| PORT | No | 3001 | Service port |
| DB_HOST | Yes | - | Database host |
| DB_PORT | No | 5432 | Database port |
| DB_USERNAME | Yes | - | Database username |
| DB_PASSWORD | Yes | - | Database password |
| DB_DATABASE | Yes | - | Database name |
| JWT_SECRET | Yes | - | JWT secret (min 32 chars) |
| JWT_EXPIRES_IN | No | 15m | Access token expiration |
| JWT_REFRESH_SECRET | Yes | - | Refresh token secret (min 32 chars) |
| JWT_REFRESH_EXPIRES_IN | No | 7d | Refresh token expiration |
| CORS_ORIGIN | No | * | CORS allowed origins |

## Troubleshooting

### Error: Environment validation failed

Make sure all required environment variables are set and JWT secrets have at least 32 characters.

### Error: Cannot connect to database

Check if PostgreSQL is running and credentials in `.env` are correct.

### Token expired error

Access tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

### Password validation fails

Ensure password meets all requirements:
- At least 8 characters
- 1 uppercase letter
- 1 lowercase letter
- 1 number
- 1 special character (@$!%*?&)
