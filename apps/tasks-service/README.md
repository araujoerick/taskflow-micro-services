# Tasks Service

Microservice for task management with comments, history tracking, and real-time notifications via RabbitMQ.

## Technologies

- NestJS 11
- TypeORM 0.3.27
- PostgreSQL
- RabbitMQ (event publishing)
- JWT (token validation)
- class-validator / class-transformer

## Setup

### 1. Configure environment variables

```bash
cp .env.example .env
# Edit .env with real values
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

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

### POST /tasks
Create a new task.

**Body:**
```json
{
  "title": "Implement feature X",
  "description": "Details about the feature",
  "status": "TODO",
  "priority": "HIGH",
  "assignedTo": "user-uuid",
  "dueDate": "2024-12-31T23:59:59.000Z"
}
```

**Required fields:** `title`

**Response (201):**
```json
{
  "id": "uuid",
  "title": "Implement feature X",
  "description": "Details about the feature",
  "status": "TODO",
  "priority": "HIGH",
  "assignedTo": "user-uuid",
  "createdBy": "creator-uuid",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /tasks
List tasks with filtering and pagination.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 10) |
| status | enum | Filter by status (TODO, IN_PROGRESS, DONE) |
| priority | enum | Filter by priority (LOW, MEDIUM, HIGH, URGENT) |
| assignedTo | uuid | Filter by assigned user |
| createdBy | uuid | Filter by creator |
| search | string | Search in title and description |

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Task title",
      "status": "TODO",
      "priority": "MEDIUM",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### GET /tasks/:id
Get task details with comments and history.

**Response (200):**
```json
{
  "id": "uuid",
  "title": "Task title",
  "description": "Task description",
  "status": "IN_PROGRESS",
  "priority": "HIGH",
  "assignedTo": "user-uuid",
  "createdBy": "creator-uuid",
  "dueDate": "2024-12-31T23:59:59.000Z",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-02T00:00:00.000Z",
  "comments": [],
  "history": []
}
```

**Error (404):**
```json
{
  "statusCode": 404,
  "message": "Task with ID <id> not found"
}
```

### PATCH /tasks/:id
Update a task. Only the creator or assigned user can update.

**Body:**
```json
{
  "title": "Updated title",
  "status": "IN_PROGRESS",
  "priority": "URGENT"
}
```

**Response (200):** Updated task object

**Error (403):**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to update this task"
}
```

### DELETE /tasks/:id
Delete a task. Only the creator can delete.

**Response (200):**
```json
{
  "message": "Task deleted successfully"
}
```

**Error (403):**
```json
{
  "statusCode": 403,
  "message": "Only the task creator can delete this task"
}
```

### GET /tasks/:id/history
Get task change history.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "taskId": "task-uuid",
    "userId": "user-uuid",
    "action": "STATUS_CHANGED",
    "changes": {
      "before": { "status": "TODO" },
      "after": { "status": "IN_PROGRESS" }
    },
    "createdAt": "2024-01-02T00:00:00.000Z"
  }
]
```

### POST /tasks/:taskId/comments
Add a comment to a task.

**Body:**
```json
{
  "content": "This is a comment"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "taskId": "task-uuid",
  "userId": "user-uuid",
  "content": "This is a comment",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### GET /tasks/:taskId/comments
List all comments for a task.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "taskId": "task-uuid",
    "userId": "user-uuid",
    "content": "This is a comment",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Task Status

| Status | Description |
|--------|-------------|
| TODO | Task not started |
| IN_PROGRESS | Task being worked on |
| DONE | Task completed |

## Task Priority

| Priority | Description |
|----------|-------------|
| LOW | Low priority |
| MEDIUM | Normal priority (default) |
| HIGH | High priority |
| URGENT | Urgent priority |

## RabbitMQ Events

The service publishes events to RabbitMQ for real-time notifications:

| Event | Description |
|-------|-------------|
| task.created | New task created |
| task.updated | Task updated |
| task.deleted | Task deleted |
| task.assigned | Task assigned to user |
| task.commented | Comment added to task |

**Event payload:**
```json
{
  "event": "task.created",
  "taskId": "uuid",
  "userId": "user-who-triggered",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "title": "Task title",
    "status": "TODO",
    "priority": "MEDIUM",
    "createdById": "creator-uuid",
    "assignedToId": "assigned-uuid"
  }
}
```

## Features

- ✅ Full CRUD for tasks
- ✅ Task filtering and pagination
- ✅ Search by title/description
- ✅ Comment system
- ✅ Change history tracking
- ✅ Permission-based access (creator/assigned)
- ✅ JWT authentication
- ✅ RabbitMQ event publishing
- ✅ Database migrations

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

- **INFO**: Successful operations (task created, updated, deleted)
- **WARN**: Permission denied attempts
- **ERROR**: System errors

Example logs:
```
[Bootstrap] Tasks service running on port 3002
[TasksService] Creating task for user abc-123
[TasksService] Task xyz-456 created successfully
[TasksService] Task xyz-456 updated successfully
[CommentsService] Comment created on task xyz-456 by user abc-123
```

## Architecture

```
apps/tasks-service/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── interfaces/
│   │   │   ├── jwt-payload.interface.ts
│   │   │   └── user-payload.interface.ts
│   │   └── strategies/
│   │       └── jwt.strategy.ts
│   ├── comments/
│   │   ├── dto/
│   │   │   └── create-comment.dto.ts
│   │   ├── entities/
│   │   │   └── comment.entity.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   └── comments.module.ts
│   ├── common/
│   │   └── filters/
│   │       └── http-exception.filter.ts
│   ├── config/
│   │   ├── typeorm.config.ts
│   │   └── env.validation.ts
│   ├── history/
│   │   ├── entities/
│   │   │   └── task-history.entity.ts
│   │   └── interfaces/
│   │       └── history-changes.interface.ts
│   ├── migrations/
│   ├── rabbitmq/
│   │   ├── rabbitmq.service.ts
│   │   └── rabbitmq.module.ts
│   ├── tasks/
│   │   ├── dto/
│   │   │   ├── create-task.dto.ts
│   │   │   ├── update-task.dto.ts
│   │   │   └── filter-task.dto.ts
│   │   ├── entities/
│   │   │   └── task.entity.ts
│   │   ├── tasks.controller.ts
│   │   ├── tasks.service.ts
│   │   └── tasks.module.ts
│   ├── app.module.ts
│   └── main.ts
└── test/
    └── tasks.e2e-spec.ts
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | No | development | Environment |
| PORT | No | 3002 | Service port |
| ALLOWED_ORIGINS | No | * | CORS allowed origins |
| DB_HOST | Yes | - | Database host |
| DB_PORT | No | 5433 | Database port |
| DB_USERNAME | Yes | - | Database username |
| DB_PASSWORD | Yes | - | Database password |
| DB_DATABASE | Yes | - | Database name |
| JWT_SECRET | Yes | - | JWT secret for validation |
| RABBITMQ_URL | Yes | - | RabbitMQ connection URL |
| RABBITMQ_QUEUE | No | task-events | RabbitMQ queue name |

## Troubleshooting

### Error: Task not found

Make sure the task ID is a valid UUID and the task exists in the database.

### Error: Permission denied

Only the task creator can delete tasks. Both creator and assigned user can update tasks.

### Error: Cannot connect to database

Check if PostgreSQL is running and credentials in `.env` are correct.

### Error: RabbitMQ connection failed

Check if RabbitMQ is running and the `RABBITMQ_URL` is correct. Events will be skipped if RabbitMQ is unavailable.

### Validation errors

Ensure request body matches the DTO requirements:
- `title` is required and max 255 characters
- `status` must be one of: TODO, IN_PROGRESS, DONE
- `priority` must be one of: LOW, MEDIUM, HIGH, URGENT
- `assignedTo` must be a valid UUID
